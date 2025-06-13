# SAAS Dashboard

A comprehensive full-stack SAAS dashboard for managing subscriptions, payments, and analytics with Stripe integration.

## ✅ Current Status (Updated June 12, 2025)

**🎉 APPLICATION IS FULLY FUNCTIONAL AND RUNNING**

- ✅ All TypeScript compilation errors resolved
- ✅ Frontend rendering issues fixed
- ✅ PostgreSQL database setup and seeded
- ✅ Both development servers running successfully
- ✅ Authentication system working
- ✅ CSS and Tailwind properly configured

**Test Credentials:**
- Admin: `admin@example.com` / `admin123`
- User: `user@example.com` / `user123`

**Running Services:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🚀 Features

- **User Authentication** - JWT-based authentication with registration and login
- **Subscription Management** - Create, cancel, and reactivate subscriptions
- **Payment Processing** - Stripe integration for secure payment handling
- **Analytics Dashboard** - Comprehensive business metrics and charts
- **User Management** - Profile management and activity tracking
- **Real-time Updates** - Webhook integration for live payment updates
- **Responsive Design** - Modern, mobile-friendly interface

## 🛠 Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** database with Prisma ORM
- **Stripe** for payment processing
- **JWT** for authentication
- **Winston** for logging

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Query** for state management
- **Chart.js** for analytics visualization
- **React Hook Form** for form handling
- **Zustand** for auth state management

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Stripe account (for payment processing)

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <your-repo>
   cd SAAS_Dashboard
   ./setup.sh
   ```

2. **Configure environment variables:**
   
   **Server (.env):**
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL="postgresql://username:password@localhost:5432/saas_dashboard"
   JWT_SECRET=your_super_secure_jwt_secret
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=http://localhost:3000
   ```

   **Client (.env):**
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. **Set up database:**
   ```bash
   # Create PostgreSQL database
   createdb saas_dashboard
   
   # Run migrations
   npm run db:migrate
   
   # Generate Prisma client
   npm run db:generate
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Prisma Studio: http://localhost:5555 (optional)

## 📁 Project Structure

```
SAAS_Dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # State management
│   │   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── prisma/             # Database schema and migrations
└── ...
```

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both client and server in development
- `npm run build` - Build both client and server for production
- `npm run install:all` - Install all dependencies

### Server
- `npm run server:dev` - Start server in development mode
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

### Client
- `npm run client:dev` - Start client in development mode
- `npm run client:build` - Build client for production

## 🎯 Key Features Explained

### Dashboard Analytics
- Revenue tracking with interactive charts
- Subscription status distribution
- Customer growth metrics
- Key performance indicators (KPIs)

### Subscription Management
- Create subscriptions with Stripe integration
- Cancel and reactivate subscriptions
- Track subscription lifecycle
- Usage analytics per subscription

### Payment Processing
- Secure payment handling via Stripe
- Payment history and receipts
- Failed payment tracking
- Automatic webhook processing

### User Management
- JWT-based authentication
- User profiles and settings
- Activity logging
- Role-based access control

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation with Joi
- CORS protection
- Helmet security headers

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Subscriptions
- `GET /api/subscriptions` - Get user subscriptions
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/reactivate` - Reactivate subscription

### Payments
- `GET /api/payments` - Get payment history
- `GET /api/payments/stats` - Get payment statistics
- `GET /api/payments/:id` - Get payment details

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/customers` - Customer analytics
- `POST /api/analytics/track` - Track custom events

## 🎨 UI Components

The application includes a comprehensive set of reusable components:
- Dashboard cards and charts
- Data tables with pagination
- Form components with validation
- Navigation and layout components
- Modal dialogs and notifications

## 🚀 Deployment

### Prerequisites
- Production PostgreSQL database
- Stripe live API keys
- SSL certificate for webhooks

### Environment Setup
1. Update environment variables for production
2. Set up production database
3. Configure Stripe webhooks
4. Deploy to your preferred platform (Vercel, Heroku, AWS, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ using modern web technologies