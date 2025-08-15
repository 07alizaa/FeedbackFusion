# 🔒 Security Setup Guide

## Important: Environment Variables Setup

Before running the application, you **MUST** configure your environment variables with secure values.

### 1. Database Configuration

Copy `backend/.env.local.example` to `backend/.env` and update with your values:

```bash
# Replace with your actual database credentials
DATABASE_URL=postgres://postgres:YOUR_ACTUAL_DB_PASSWORD@localhost:5432/feedbackfusion

# OR use individual components
DB_USER=postgres
DB_HOST=localhost
DB_NAME=feedbackfusion
DB_PASSWORD=YOUR_ACTUAL_DB_PASSWORD
DB_PORT=5432
```

### 2. JWT Secret

Generate a secure JWT secret:

```bash
# Method 1: Using OpenSSL
openssl rand -hex 64

# Method 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then update your `.env`:
```
JWT_SECRET=your_generated_secure_jwt_secret_here
```

### 3. Admin Password

Set a secure admin password in your `.env`:
```
ADMIN_DEFAULT_PASSWORD=YourSecureAdminPassword123!
```

### 4. Default Admin Login

After setup, login with:
- **Email**: `admin@gmail.com`
- **Password**: Whatever you set in `ADMIN_DEFAULT_PASSWORD`

## ⚠️ Security Warnings

1. **Never commit `.env` files** - They contain sensitive data
2. **Change default passwords** - Always use strong, unique passwords
3. **Rotate secrets regularly** - Update JWT secrets and passwords periodically
4. **Use HTTPS in production** - Never send secrets over HTTP

## Production Deployment

For production, use environment variables provided by your hosting platform instead of `.env` files.

### Heroku Example:
```bash
heroku config:set DATABASE_URL=your_production_db_url
heroku config:set JWT_SECRET=your_production_jwt_secret
heroku config:set ADMIN_DEFAULT_PASSWORD=your_secure_admin_password
```

### Vercel Example:
Add environment variables in your Vercel dashboard under Project Settings → Environment Variables.
