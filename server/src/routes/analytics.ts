import express from 'express';
import { prisma } from '../index';
import { auth, adminAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard analytics
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'TRIALING'] }
      }
    });

    // Total revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        userId: user.id,
        status: 'SUCCEEDED',
        createdAt: { gte: startDate }
      },
      _sum: { amount: true }
    });

    // Monthly recurring revenue (MRR)
    const activeMonthlySubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      include: {
        plan: true
      }
    });

    const mrr = activeMonthlySubscriptions.reduce((sum, sub) => {
      if (sub.plan.interval === 'month') {
        return sum + sub.plan.amount;
      } else if (sub.plan.interval === 'year') {
        return sum + (sub.plan.amount / 12);
      }
      return sum;
    }, 0);

    // Failed payments
    const failedPayments = await prisma.payment.count({
      where: {
        userId: user.id,
        status: 'FAILED',
        createdAt: { gte: startDate }
      }
    });

    // Churn rate calculation
    const totalCancelledThisPeriod = await prisma.subscription.count({
      where: {
        userId: user.id,
        status: 'CANCELED',
        canceledAt: { gte: startDate }
      }
    });

    const totalActiveAtStart = await prisma.subscription.count({
      where: {
        userId: user.id,
        createdAt: { lt: startDate }
      }
    });

    const churnRate = totalActiveAtStart > 0 ? (totalCancelledThisPeriod / totalActiveAtStart) * 100 : 0;

    // Revenue trend (daily data for charts)
    const revenueTrend = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        SUM(amount) as revenue,
        COUNT(*) as payment_count
      FROM payments 
      WHERE user_id = ${user.id} 
        AND status = 'SUCCEEDED' 
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Subscription status distribution
    const subscriptionsByStatus = await prisma.subscription.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: { status: true }
    });

    // Recent activities
    const recentActivities = await prisma.userActivity.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          activeSubscriptions,
          totalRevenue: totalRevenue._sum.amount || 0,
          mrr,
          failedPayments,
          churnRate: Math.round(churnRate * 100) / 100
        },
        charts: {
          revenueTrend,
          subscriptionsByStatus
        },
        recentActivities
      }
    });
  } catch (error) {
    logger.error('Get dashboard analytics error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/customers
// @desc    Get customer analytics
// @access  Private
router.get('/customers', auth, async (req, res) => {
  try {
    const user = (req as any).user;

    // Customer acquisition over time
    const customerGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_customers
      FROM users 
      WHERE company_id = ${user.companyId}
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    // Customer lifetime value (CLV)
    const clvData = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        SUM(p.amount) as total_spent,
        COUNT(p.id) as payment_count,
        MIN(p.created_at) as first_payment,
        MAX(p.created_at) as last_payment
      FROM users u
      LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'SUCCEEDED'
      WHERE u.company_id = ${user.companyId}
      GROUP BY u.id, u.email, u.first_name, u.last_name
      ORDER BY total_spent DESC
      LIMIT 50
    `;

    // Customer segments
    const segments = await prisma.$queryRaw`
      SELECT 
        CASE 
          WHEN total_spent >= 10000 THEN 'Enterprise'
          WHEN total_spent >= 5000 THEN 'Professional'
          WHEN total_spent >= 1000 THEN 'Standard'
          ELSE 'Basic'
        END as segment,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_spent
      FROM (
        SELECT 
          u.id,
          COALESCE(SUM(p.amount), 0) as total_spent
        FROM users u
        LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'SUCCEEDED'
        WHERE u.company_id = ${user.companyId}
        GROUP BY u.id
      ) customer_totals
      GROUP BY segment
      ORDER BY avg_spent DESC
    `;

    res.json({
      success: true,
      data: {
        customerGrowth,
        topCustomers: clvData,
        segments
      }
    });
  } catch (error) {
    logger.error('Get customer analytics error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/analytics/admin
// @desc    Get admin analytics (all users)
// @access  Private (Admin)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    // Platform-wide metrics
    const totalUsers = await prisma.user.count();
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'SUCCEEDED' },
      _sum: { amount: true }
    });
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: { in: ['ACTIVE', 'TRIALING'] } }
    });

    // Growth metrics
    const userGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    const revenueGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as payment_count
      FROM payments 
      WHERE status = 'SUCCEEDED' 
        AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    // Plan popularity
    const planStats = await prisma.$queryRaw`
      SELECT 
        p.name,
        p.amount,
        COUNT(s.id) as subscription_count,
        SUM(CASE WHEN s.status IN ('ACTIVE', 'TRIALING') THEN 1 ELSE 0 END) as active_count
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id, p.name, p.amount
      ORDER BY subscription_count DESC
    `;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeSubscriptions
        },
        growth: {
          users: userGrowth,
          revenue: revenueGrowth
        },
        planStats
      }
    });
  } catch (error) {
    logger.error('Get admin analytics error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/analytics/track
// @desc    Track custom analytics event
// @access  Private
router.post('/track', auth, async (req, res) => {
  try {
    const { metric, value, dimensions } = req.body;
    const user = (req as any).user;

    await prisma.analytics.create({
      data: {
        metric,
        value,
        dimensions: dimensions || {}
      }
    });

    // Also log as user activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'ANALYTICS_EVENT',
        description: `Tracked metric: ${metric}`,
        metadata: { metric, value, dimensions }
      }
    });

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    logger.error('Track analytics error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
