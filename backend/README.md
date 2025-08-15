# FeedbackFusion Backend

A complete Node.js backend MVP for a customer feedback collection platform with role-based access control, anonymous feedback submission, and AI-powered feedback scoring.

## Features

- **User Authentication**: JWT-based auth with bcryptjs password hashing
- **Role-Based Access**: Vendor and Admin roles with protected routes
- **Feedback Forms**: Create, update, delete, and manage feedback forms
- **Anonymous Feedback**: Public feedback submission with optional contact details
- **AI Scoring**: Basic AI simulation for scoring and flagging quality feedback
- **Database**: PostgreSQL with automatic schema setup
- **Security**: Input validation, CORS, environment variables

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT + bcryptjs
- **Environment**: dotenv
- **CORS**: cors middleware

## Project Structure

```
feedbackfusion-backend/
├── controllers/
│   ├── authController.js      # Authentication logic
│   ├── formController.js      # Form management
│   └── feedbackController.js  # Feedback submission & stats
├── middleware/
│   ├── authMiddleware.js      # JWT authentication
│   └── roleMiddleware.js      # Role-based access control
├── models/
│   └── db.js                  # Database schema & connection
├── routes/
│   ├── authRoutes.js          # Auth endpoints
│   ├── formRoutes.js          # Form management endpoints
│   ├── feedbackRoutes.js      # Feedback endpoints
│   └── auth.js                # Legacy auth routes
├── utils/
│   └── aiHelper.js            # AI scoring simulation
├── server.js                  # Alternative main server
├── index.js                   # Main server file
├── db.js                      # Database export
├── package.json               # Dependencies
└── .env.example               # Environment variables template
```

## Database Schema

### Users Table
```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(255) NOT NULL)
- email (VARCHAR(255) UNIQUE NOT NULL)
- password_hash (VARCHAR(255) NOT NULL)
- role (VARCHAR(50) CHECK: 'vendor' or 'admin')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Feedback Forms Table
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- title (VARCHAR(255) NOT NULL)
- config (JSONB) - Drag-drop form configuration
- is_active (BOOLEAN DEFAULT true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Feedback Entries Table
```sql
- id (SERIAL PRIMARY KEY)
- form_id (INTEGER REFERENCES feedback_forms)
- answers (JSONB) - Form responses
- wants_to_be_contacted (BOOLEAN DEFAULT false)
- contact_details (JSONB) - Optional contact info
- ai_score (INTEGER) - AI-generated quality score
- is_flagged (BOOLEAN) - Flagged for review
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Setup & Installation

### 1. Clone and Install
```bash
git clone <repository-url>
cd feedbackfusion-backend
npm install
```

### 2. Database Setup
```bash
# Install PostgreSQL if not already installed
# macOS with Homebrew:
brew install postgresql
brew services start postgresql

# Create database
createdb feedbackfusion

# Or connect to existing PostgreSQL instance
psql -U your_username -h your_host
CREATE DATABASE feedbackfusion;
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration:
# - Set DATABASE_URL to your PostgreSQL connection string
# - Set JWT_SECRET to a secure random string
# - Configure PORT and other settings
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will automatically:
- Connect to the database
- Create tables and indexes
- Set up triggers for timestamp updates
- Start listening on the configured port (default: 5000)

## API Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/signup`
Register a new user (vendor or admin)
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "securepassword",
  "role": "vendor"
}
```

#### POST `/api/auth/login`
Login and receive JWT token
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### GET `/api/auth/profile`
Get current user profile (requires authentication)

### Forms (`/api/forms`)

#### POST `/api/forms`
Create new feedback form (vendor only)
```json
{
  "title": "Customer Satisfaction Survey",
  "config": {
    "fields": [
      {"type": "text", "label": "Name", "required": false},
      {"type": "email", "label": "Email", "required": false},
      {"type": "textarea", "label": "Feedback", "required": true}
    ]
  }
}
```

#### GET `/api/forms/:id`
Get form configuration (public access)

#### GET `/api/forms/vendor/my`
Get all forms for logged-in vendor

#### PUT `/api/forms/:id`
Update form (vendor only, own forms)

#### DELETE `/api/forms/:id`
Delete form (vendor only, own forms)

#### GET `/api/forms/:id/entries`
Get feedback entries for form (vendor only)

### Feedback Submission (`/api`)

#### POST `/api/forms/:formId/submit`
Submit feedback anonymously
```json
{
  "answers": {
    "name": "Anonymous User",
    "feedback": "Great service, very satisfied!"
  },
  "wantsToBeContacted": true,
  "contactDetails": {
    "email": "user@example.com",
    "phone": "+1234567890",
    "name": "John Doe"
  }
}
```

#### GET `/api/forms/:formId/stats`
Get feedback statistics (vendor only)

#### GET `/api/feedback/:entryId`
Get specific feedback entry (vendor only)

#### PATCH `/api/feedback/:entryId/flag`
Update entry flag status (vendor only)

## AI Scoring System

The AI helper simulates intelligent feedback scoring based on:

- **Text Length**: Longer, detailed responses score higher
- **Sentiment Analysis**: Positive, negative, and constructive keywords
- **Engagement Metrics**: Questions, exclamations, specific details
- **Quality Indicators**: Sentence structure, vocabulary complexity
- **Spam Detection**: Flags promotional or spam content

Scores range from 0-100, with top 10-20% flagged for vendor review.

## Authentication & Security

- **JWT Tokens**: 24-hour expiration, signed with secure secret
- **Password Hashing**: bcryptjs with 12 salt rounds
- **Role-Based Access**: Middleware enforces vendor/admin permissions
- **Input Validation**: Comprehensive validation on all endpoints
- **CORS**: Configurable cross-origin resource sharing
- **Environment Variables**: Sensitive data stored securely

## Error Handling

- Consistent JSON error responses
- Proper HTTP status codes
- Development vs production error details
- Database connection error handling
- JWT verification error handling

## Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (placeholder)
```

### Environment Variables
```bash
PORT=5000                          # Server port
NODE_ENV=development               # Environment mode
DATABASE_URL=postgresql://...      # PostgreSQL connection
JWT_SECRET=your_secret_key         # JWT signing secret
ALLOWED_ORIGINS=http://localhost:3000  # CORS origins
```

### Database Initialization
The database schema is automatically created when the server starts. Tables, indexes, and triggers are set up programmatically.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure PostgreSQL instance
3. Set a strong `JWT_SECRET`
4. Configure proper CORS origins
5. Set up SSL/TLS for database connections
6. Consider connection pooling limits
7. Set up logging and monitoring

## API Testing

Use tools like Postman, Insomnia, or curl:

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"vendor"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**FeedbackFusion** - Collect, analyze, and act on customer feedback with ease.
