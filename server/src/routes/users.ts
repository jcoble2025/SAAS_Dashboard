import express from 'express';
import { prisma } from '../index';
import { auth, adminAuth } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        company: true,
        subscriptions: {
          include: {
            plan: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = (req as any).user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName
      },
      include: {
        company: true
      }
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId,
        action: 'PROFILE_UPDATED',
        description: 'User profile updated'
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update profile error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/activities
// @desc    Get user activities
// @access  Private
router.get('/activities', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = (req as any).user.id;

    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.userActivity.count({ where: { userId } });

    res.json({
      success: true,
      data: activities,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    logger.error('Get activities error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/admin/all
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      include: {
        company: true,
        subscriptions: {
          include: {
            plan: true
          }
        },
        _count: {
          select: {
            payments: true,
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      success: true,
      data: users,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    });
  } catch (error) {
    logger.error('Get all users error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
