# 🚀 FeedbackFusion

A modern, full-stack SaaS platform for customer feedback management with AI-powered insights and multi-tier subscription support.

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- **🔐 Multi-Role Authentication** - Secure JWT-based auth with role-based access control
- **📝 Dynamic Form Builder** - Drag & drop form creation with 20+ field types
- **🤖 AI-Powered Analytics** - Sentiment analysis and automated feedback insights  
- **💳 Subscription Management** - Multi-tier plans with usage tracking
- **🏢 Business Profiles** - Public business pages with SEO optimization
- **📊 Real-time Analytics** - Advanced dashboards with export capabilities
- **🔔 Smart Notifications** - Real-time alerts and email notifications
- **📱 QR Code Generation** - Dynamic QR codes for easy form sharing
- **🛡️ Admin Dashboard** - Complete platform management and moderation

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js framework
- **PostgreSQL** database with optimized schema
- **Socket.IO** for real-time features
- **JWT** authentication with bcrypt
- **OpenAI** integration for AI features

### Frontend  
- **React 19** with modern hooks
- **Vite** for lightning-fast development
- **Tailwind CSS** for responsive design
- **React Query** for server state management
- **Zustand** for client state management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/feedbackfusion.git
   cd feedbackfusion
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment template
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   
   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend-v2
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

4. **Database Setup**
   ```bash
   # The database schema will be automatically created when the backend starts
   # Or manually initialize:
   npm run init-db
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/feedbackfusion

# JWT Secret (generate with: openssl rand -hex 64)
JWT_SECRET=your_super_secure_jwt_secret_key_here

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:5174,http://localhost:3000
```

## 📖 Usage

1. **Access the application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:5001

2. **Create an account**
   - Sign up as a vendor to create feedback forms
   - Admin accounts can manage the entire platform

3. **Build feedback forms**
   - Use the drag & drop form builder
   - Configure conditional logic and validation
   - Generate QR codes for easy sharing

4. **Collect & analyze feedback**
   - Share forms publicly or embed them
   - View AI-powered sentiment analysis
   - Export data for further analysis

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/profile` - Get user profile

### Forms & Feedback
- `GET /api/forms` - List user's forms
- `POST /api/forms` - Create new form
- `POST /api/forms/:id/submit` - Submit feedback (public)
- `GET /api/forms/:id/analytics` - Get form analytics

### Admin
- `GET /api/admin/users` - Manage users (admin only)
- `GET /api/admin/stats` - Platform statistics
- `PUT /api/admin/users/:id/flag` - Flag/unflag users

## 🏢 Business Model

### Subscription Tiers

- **Free**: 5 forms, 100 responses/month, basic analytics
- **Pro ($29/month)**: Unlimited forms, 5,000 responses, AI features  
- **Enterprise ($99/month)**: Unlimited usage, team features, priority support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue on GitHub
- Email: your-email@domain.com

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced AI features
- [ ] Third-party integrations (Slack, Teams)
- [ ] Multi-language support
- [ ] Advanced reporting features

---

**Built with ❤️ using modern web technologies**
