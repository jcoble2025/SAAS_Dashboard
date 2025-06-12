import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample plans
  const basicPlan = await prisma.plan.upsert({
    where: { stripePriceId: 'price_basic_monthly' },
    update: {},
    create: {
      name: 'Basic Plan',
      stripePriceId: 'price_basic_monthly',
      stripeProductId: 'prod_basic',
      amount: 999, // $9.99
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      features: [
        'Up to 10 users',
        'Basic analytics',
        'Email support',
        '5GB storage'
      ],
      isActive: true
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { stripePriceId: 'price_pro_monthly' },
    update: {},
    create: {
      name: 'Pro Plan',
      stripePriceId: 'price_pro_monthly',
      stripeProductId: 'prod_pro',
      amount: 2999, // $29.99
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      features: [
        'Up to 50 users',
        'Advanced analytics',
        'Priority support',
        '50GB storage',
        'Custom integrations'
      ],
      isActive: true
    }
  })

  const enterprisePlan = await prisma.plan.upsert({
    where: { stripePriceId: 'price_enterprise_monthly' },
    update: {},
    create: {
      name: 'Enterprise Plan',
      stripePriceId: 'price_enterprise_monthly',
      stripeProductId: 'prod_enterprise',
      amount: 9999, // $99.99
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      features: [
        'Unlimited users',
        'Enterprise analytics',
        '24/7 phone support',
        '500GB storage',
        'Custom integrations',
        'Dedicated account manager',
        'SSO integration'
      ],
      isActive: true
    }
  })

  // Create sample company
  const company = await prisma.company.upsert({
    where: { domain: 'example.com' },
    update: {},
    create: {
      name: 'Example Corp',
      domain: 'example.com',
      industry: 'Technology',
      size: 'MEDIUM'
    }
  })

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
      companyId: company.id
    }
  })

  // Create sample user
  const userPassword = await bcrypt.hash('user123', 10)
  const sampleUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isEmailVerified: true,
      companyId: company.id,
      stripeCustomerId: 'cus_sample_customer'
    }
  })

  // Create sample subscription
  const subscription = await prisma.subscription.upsert({
    where: { stripeSubscriptionId: 'sub_sample_subscription' },
    update: {},
    create: {
      stripeSubscriptionId: 'sub_sample_subscription',
      userId: sampleUser.id,
      planId: proPlan.id,
      companyId: company.id,
      status: 'ACTIVE',
      priceId: proPlan.stripePriceId,
      quantity: 1,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false
    }
  })

  // Create sample payments
  const payment1 = await prisma.payment.create({
    data: {
      stripePaymentId: 'pi_sample_payment_1',
      userId: sampleUser.id,
      subscriptionId: subscription.id,
      amount: proPlan.amount,
      currency: 'usd',
      status: 'SUCCEEDED',
      description: 'Pro Plan subscription',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    }
  })

  const payment2 = await prisma.payment.create({
    data: {
      stripePaymentId: 'pi_sample_payment_2',
      userId: sampleUser.id,
      subscriptionId: subscription.id,
      amount: proPlan.amount,
      currency: 'usd',
      status: 'SUCCEEDED',
      description: 'Pro Plan subscription',
      createdAt: new Date()
    }
  })

  // Create sample user activities
  await prisma.userActivity.createMany({
    data: [
      {
        userId: sampleUser.id,
        action: 'USER_LOGIN',
        description: 'User logged in successfully',
        createdAt: new Date()
      },
      {
        userId: sampleUser.id,
        action: 'SUBSCRIPTION_CREATED',
        description: 'Created subscription for Pro Plan',
        metadata: { subscriptionId: subscription.id, planId: proPlan.id },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        userId: sampleUser.id,
        action: 'PAYMENT_SUCCEEDED',
        description: 'Payment of $29.99 USD succeeded',
        metadata: { amount: proPlan.amount, currency: 'usd' },
        createdAt: new Date()
      }
    ]
  })

  // Create sample analytics data
  await prisma.analytics.createMany({
    data: [
      {
        metric: 'revenue',
        value: proPlan.amount,
        dimensions: { currency: 'usd', plan: 'pro' },
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        metric: 'revenue',
        value: proPlan.amount,
        dimensions: { currency: 'usd', plan: 'pro' },
        timestamp: new Date()
      },
      {
        metric: 'new_user',
        value: 1,
        dimensions: { source: 'organic' },
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    ]
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Admin user: admin@example.com (password: admin123)')
  console.log('📧 Sample user: user@example.com (password: user123)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
