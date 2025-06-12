import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../index';
import { auth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// @route   GET /api/subscriptions
// @desc    Get user subscriptions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: (req as any).user.id },
      include: {
        plan: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    logger.error('Get subscriptions error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/subscriptions/create
// @desc    Create subscription
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const user = (req as any).user;

    // Get plan details
    const plan = await prisma.plan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id
        }
      });
      
      customerId = customer.id;
      
      // Update user with customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    // Create subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: plan.stripePriceId,
        quantity: 1
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent']
    });

    // Save subscription to database
    const subscription = await prisma.subscription.create({
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        userId: user.id,
        planId: plan.id,
        companyId: user.companyId,
        status: stripeSubscription.status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        priceId: plan.stripePriceId
      },
      include: {
        plan: true
      }
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_CREATED',
        description: `Created subscription for plan: ${plan.name}`,
        metadata: { subscriptionId: subscription.id, planId: plan.id }
      }
    });

    logger.info('Subscription created', { 
      userId: user.id, 
      subscriptionId: subscription.id,
      planId: plan.id 
    });

    res.json({
      success: true,
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
    });
  } catch (error) {
    logger.error('Create subscription error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelAtPeriodEnd = true } = req.body;
    const user = (req as any).user;

    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId: user.id }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel in Stripe
    if (cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    } else {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd,
        canceledAt: cancelAtPeriodEnd ? undefined : new Date(),
        status: cancelAtPeriodEnd ? subscription.status : 'CANCELED'
      },
      include: {
        plan: true
      }
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_CANCELED',
        description: `Canceled subscription: ${subscription.id}`,
        metadata: { subscriptionId: subscription.id, cancelAtPeriodEnd }
      }
    });

    logger.info('Subscription canceled', { 
      userId: user.id, 
      subscriptionId: subscription.id,
      cancelAtPeriodEnd 
    });

    res.json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error('Cancel subscription error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/subscriptions/:id/reactivate
// @desc    Reactivate subscription
// @access  Private
router.post('/:id/reactivate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId: user.id }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    // Update in database
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null
      },
      include: {
        plan: true
      }
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'SUBSCRIPTION_REACTIVATED',
        description: `Reactivated subscription: ${subscription.id}`,
        metadata: { subscriptionId: subscription.id }
      }
    });

    logger.info('Subscription reactivated', { 
      userId: user.id, 
      subscriptionId: subscription.id 
    });

    res.json({
      success: true,
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error('Reactivate subscription error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/subscriptions/:id/usage
// @desc    Get subscription usage
// @access  Private
router.get('/:id/usage', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    // Find subscription
    const subscription = await prisma.subscription.findFirst({
      where: { id, userId: user.id },
      include: {
        usageRecords: {
          orderBy: { timestamp: 'desc' },
          take: 100
        }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate usage statistics
    const totalUsage = subscription.usageRecords.reduce((sum, record) => sum + record.quantity, 0);
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = subscription.usageRecords
      .filter(record => record.timestamp >= currentMonth)
      .reduce((sum, record) => sum + record.quantity, 0);

    res.json({
      success: true,
      data: {
        subscription,
        totalUsage,
        monthlyUsage,
        usageRecords: subscription.usageRecords
      }
    });
  } catch (error) {
    logger.error('Get usage error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
