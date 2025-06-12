import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// @route   POST /api/webhooks/stripe
// @desc    Handle Stripe webhooks
// @access  Public (but verified)
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret);
  } catch (err: any) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;
        
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  try {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (existingSubscription) {
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status as any,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        }
      });

      logger.info('Subscription updated', { subscriptionId: subscription.id });
    }
  } catch (error) {
    logger.error('Error updating subscription', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date()
      }
    });

    logger.info('Subscription deleted', { subscriptionId: subscription.id });
  } catch (error) {
    logger.error('Error deleting subscription', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { user: true }
      });

      if (subscription) {
        await prisma.payment.create({
          data: {
            stripePaymentId: invoice.payment_intent as string,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'SUCCEEDED',
            description: invoice.description || 'Subscription payment',
            receiptUrl: invoice.hosted_invoice_url,
            userId: subscription.userId,
            subscriptionId: subscription.id
          }
        });

        // Log activity
        await prisma.userActivity.create({
          data: {
            userId: subscription.userId,
            action: 'PAYMENT_SUCCEEDED',
            description: `Payment succeeded for amount: ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`,
            metadata: { 
              paymentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null,
              amount: invoice.amount_paid,
              currency: invoice.currency
            }
          }
        });

        logger.info('Payment succeeded', { 
          userId: subscription.userId,
          amount: invoice.amount_paid,
          currency: invoice.currency
        });
      }
    }
  } catch (error) {
    logger.error('Error handling payment succeeded', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (invoice.subscription) {
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: invoice.subscription as string },
        include: { user: true }
      });

      if (subscription) {
        await prisma.payment.create({
          data: {
            stripePaymentId: invoice.payment_intent as string || `failed_${Date.now()}`,
            amount: invoice.amount_due,
            currency: invoice.currency,
            status: 'FAILED',
            description: invoice.description || 'Subscription payment failed',
            userId: subscription.userId,
            subscriptionId: subscription.id
          }
        });

        // Log activity
        await prisma.userActivity.create({
          data: {
            userId: subscription.userId,
            action: 'PAYMENT_FAILED',
            description: `Payment failed for amount: ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()}`,
            metadata: { 
              paymentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || null,
              amount: invoice.amount_due,
              currency: invoice.currency
            }
          }
        });

        logger.warn('Payment failed', { 
          userId: subscription.userId,
          amount: invoice.amount_due,
          currency: invoice.currency
        });
      }
    }
  } catch (error) {
    logger.error('Error handling payment failed', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    if (customer.metadata?.userId) {
      await prisma.user.update({
        where: { id: customer.metadata.userId },
        data: { stripeCustomerId: customer.id }
      });

      logger.info('Customer created and linked', { 
        customerId: customer.id,
        userId: customer.metadata.userId
      });
    }
  } catch (error) {
    logger.error('Error handling customer created', error);
  }
}

export default router;
