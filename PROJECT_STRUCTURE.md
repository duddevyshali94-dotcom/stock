# Project Structure

This document provides an overview of the Real-Time Stock Market System project structure.

## Directory Tree

```
real-time-stock-market-system/
├── backend/                          # Backend application
│   └── src/
│       ├── config/                   # Configuration files
│       │   └── supabase.js          # Supabase client initialization
│       ├── middleware/               # Express middleware
│       │   ├── authMiddleware.js    # JWT authentication middleware
│       │   └── roleMiddleware.js    # Role-based access control
│       ├── routes/                   # API route handlers (Phase 2)
│       ├── services/                 # Business logic services (Phase 2)
│       ├── utils/                    # Utility functions
│       ├── index.js                  # Application entry point
│       └── server.js                 # Express server configuration
│
├── frontend/                         # Frontend application
│   ├── assets/                       # Static assets (images, etc.)
│   ├── css/
│   │   └── styles.css               # Application styles
│   ├── js/
│   │   └── main.js                  # Frontend JavaScript
│   └── index.html                   # Main HTML page
│
├── node_modules/                     # NPM dependencies (not in git)
│
├── .env                              # Environment variables (not in git)
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
├── package.json                      # NPM package configuration
├── package-lock.json                 # NPM dependency lock file
├── README.md                         # Project documentation
├── SETUP.md                          # Supabase setup guide
└── PROJECT_STRUCTURE.md             # This file
```

## Component Descriptions

### Backend Components

#### `/backend/src/index.js`
- Application entry point
- Loads environment variables with dotenv
- Handles graceful shutdown signals
- Starts the Express server

#### `/backend/src/server.js`
- Express server setup and configuration
- CORS middleware configuration
- Body parser setup
- Request logging middleware
- Health check endpoint
- Error handling middleware
- 404 handler

#### `/backend/src/config/supabase.js`
- Initializes Supabase client for public API calls
- Initializes Supabase admin client for server-side operations
- Tests database connection on startup
- Exports clients for use across the application

#### `/backend/src/middleware/authMiddleware.js`
- Extracts JWT token from Authorization header
- Validates token with Supabase Auth
- Attaches user information to request object
- Returns 401 for invalid/missing tokens

#### `/backend/src/middleware/roleMiddleware.js`
- Checks user role from database
- Restricts access based on allowed roles
- Returns 403 for insufficient permissions
- Supports multiple role checks

### Frontend Components

#### `/frontend/index.html`
- Main HTML template
- Navigation structure
- Welcome section with system status indicator
- Script and stylesheet references

#### `/frontend/css/styles.css`
- Modern, responsive styles
- Color scheme and typography
- Component-specific styles
- Loading animations

#### `/frontend/js/main.js`
- Health check functionality
- API communication
- DOM manipulation
- Auto-refresh status every 30 seconds

### Configuration Files

#### `package.json`
- Project metadata and description
- NPM dependencies and versions
- Scripts for running the application
- Project keywords and license

#### `.env`
- Supabase credentials (URL and API keys)
- Server configuration (port, environment)
- Frontend URL for CORS
- **Note**: Never commit this file to git

#### `.env.example`
- Template for environment variables
- Safe to commit to git
- Used for setup instructions

#### `.gitignore`
- Excludes node_modules from git
- Excludes .env from git
- Excludes build artifacts and logs
- Excludes IDE and OS files

## API Endpoints (Current)

### Health Check
- **Endpoint**: `GET /api/health`
- **Authentication**: None
- **Response**: Server status and timestamp

### Coming in Phase 2
- Authentication endpoints (register, login, logout)
- Stock endpoints (list, search, details, history)
- Portfolio endpoints (create, read, update, delete)
- Watchlist endpoints (add, remove, list)
- User management endpoints (admin only)

## Data Flow

### Authentication Flow
1. User sends credentials to backend
2. Backend validates with Supabase Auth
3. Supabase returns JWT token
4. Frontend stores token
5. Token sent with subsequent requests
6. authMiddleware validates token
7. User information attached to request

### Request Flow
```
Client Request
    ↓
CORS Middleware
    ↓
Body Parser
    ↓
Request Logger
    ↓
Route Handler
    ↓
authMiddleware (if protected)
    ↓
roleMiddleware (if role-restricted)
    ↓
Business Logic
    ↓
Supabase Database
    ↓
Response to Client
```

## Environment Variables

### Required
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public API key for client operations
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key for server operations

### Optional
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (default: http://localhost:3000)

## Security Considerations

### Current Implementation
- ✅ Environment variables for secrets
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ CORS protection
- ✅ .env excluded from git
- ✅ Error handling without exposing internals

### Phase 2 Additions
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- Rate limiting
- SQL injection prevention
- XSS protection

## Development Workflow

### Starting Development
```bash
# Install dependencies
npm install

# Start server
npm start

# Server runs on http://localhost:5000
```

### Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Expected response
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Next Steps (Phase 2)

1. **Database Schema**
   - Create tables in Supabase
   - Set up Row Level Security policies
   - Create database indexes

2. **API Endpoints**
   - Implement authentication routes
   - Implement stock routes
   - Implement portfolio routes
   - Implement user management routes

3. **Services Layer**
   - Stock data fetching service
   - Portfolio calculation service
   - Notification service
   - Scheduler for periodic tasks

4. **Frontend Enhancement**
   - User authentication UI
   - Stock listing and search
   - Portfolio dashboard
   - Real-time price updates

## Troubleshooting

### Common Issues

**Server won't start**
- Check `.env` file exists and is properly configured
- Verify port 5000 is not already in use
- Ensure all dependencies are installed

**Supabase connection fails**
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Ensure network connectivity

**CORS errors**
- Check `FRONTEND_URL` matches actual frontend URL
- Verify CORS configuration in `server.js`

## Resources

- [Express Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

Last Updated: Phase 1 - Infrastructure Setup Complete
