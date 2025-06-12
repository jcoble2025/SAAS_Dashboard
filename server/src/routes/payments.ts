import express from 'express';
import { prisma } from '../index';
import { auth, adminAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/payments
// @desc    Get user payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = (req as any).user;

    const where: any = { userId: user.id };
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.payment.count({ where });

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    logger.error('Get payments error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Total revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: { userId: user.id, status: 'SUCCEEDED' },
      _sum: { amount: true }
    });

    // Monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await prisma.payment.aggregate({
      where: { 
        userId: user.id, 
        status: 'SUCCEEDED',
        createdAt: { gte: currentMonth }
      },
      _sum: { amount: true }
    });

    // Payment counts by status
    const paymentsByStatus = await prisma.payment.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true }
    });

    // Recent payments (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentPayments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        status: 'SUCCEEDED',
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        amount: true,
        createdAt: true,
        currency: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month for chart data
    const monthlyData = recentPayments.reduce((acc: any, payment) => {
      const month = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + payment.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        paymentsByStatus,
        monthlyData
      }
    });
  } catch (error) {
    logger.error('Get payment stats error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const payment = await prisma.payment.findFirst({
      where: { id, userId: user.id },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Get payment error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/payments/admin/all
// @desc    Get all payments (admin only)
// @access  Private (Admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        subscription: {
          include: {
            plan: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.payment.count({ where });

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    logger.error('Get all payments error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
