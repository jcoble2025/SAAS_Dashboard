import express from 'express';
import { prisma } from '../index';
import { adminAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/plans
// @desc    Get all plans
// @access  Public
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    logger.error('Get plans error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/plans
// @desc    Create new plan
// @access  Private (Admin)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, stripePriceId, stripeProductId, amount, currency, interval, intervalCount, features } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        stripePriceId,
        stripeProductId,
        amount,
        currency,
        interval,
        intervalCount,
        features
      }
    });

    logger.info('Plan created', { planId: plan.id, name: plan.name });

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Create plan error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/plans/:id
// @desc    Update plan
// @access  Private (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, features, isActive } = req.body;

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        amount,
        features,
        isActive
      }
    });

    logger.info('Plan updated', { planId: plan.id, name: plan.name });

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    logger.error('Update plan error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
