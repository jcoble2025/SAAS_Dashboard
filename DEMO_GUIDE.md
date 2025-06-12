# 🚀 Quick Demo Guide

This guide will help you quickly launch and test the SAAS Dashboard.

## 📋 Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL running locally
- ✅ A Stripe account (for payment testing)

## 🏃‍♂️ Quick Start (5 minutes)

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb saas_dashboard

# OR using PostgreSQL command line
psql -c "CREATE DATABASE saas_dashboard;"
```

### 2. Environment Configuration
```bash
# Copy environment files
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Update server/.env:**
```env
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/saas_dashboard"
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

**Update client/.env:**
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Database Migration & Seeding
```bash
# Run database migrations
npm run db:migrate

# Seed with sample data
cd server && npm run db:seed
```

### 4. Launch Application
```bash
# Start both frontend and backend
npm run dev
```

## 🎯 Demo Login Credentials

After seeding, you can login with:

**Admin User:**
- Email: `admin@example.com`
- Password: `admin123`

**Regular User:**
- Email: `user@example.com`  
- Password: `user123`

## 🔗 Application URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Prisma Studio:** http://localhost:5555 (run `npm run db:studio`)

## 🧪 Testing Features

### 1. Dashboard Analytics
- Login and view the main dashboard
- Check revenue charts and KPI cards
- View subscription status distribution

### 2. Subscription Management
- Navigate to Subscriptions page
- View active subscriptions
- Try canceling/reactivating (sample data)

### 3. Payment History
- Go to Payments page
- View payment history and statistics
- Check payment status filters

### 4. User Settings
- Visit Settings page
- Update profile information
- View activity log

## 🎨 Sample Data Included

The seed script creates:
- 3 subscription plans (Basic, Pro, Enterprise)
- 1 company (Example Corp)
- 2 users (admin and regular user)
- 1 active subscription
- Sample payment history
- User activity logs

## 🔧 Stripe Integration Testing

To test payments (optional):

1. **Set up Stripe Test Mode:**
   - Get test API keys from Stripe Dashboard
   - Use test card numbers: `4242 4242 4242 4242`

2. **Webhook Testing:**
   - Install Stripe CLI: `stripe login`
   - Forward events: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
   - Copy webhook secret to `.env`

## 🚀 Production Deployment

For production deployment:

1. **Database:** Use a cloud PostgreSQL service
2. **Environment:** Set production environment variables
3. **Stripe:** Switch to live API keys
4. **Build:** Run `npm run build`
5. **Deploy:** Use Vercel, Heroku, or your preferred platform

## 🆘 Common Issues

**Database Connection Error:**
- Ensure PostgreSQL is running
- Check database URL in `.env`
- Verify database exists

**Port Already in Use:**
- Kill processes: `lsof -ti:3000,3001 | xargs kill`
- Or change ports in package.json

**Stripe Errors:**
- Verify API keys are correct
- Ensure using test mode keys for development

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check PostgreSQL connection

---

Happy coding! 🎉
