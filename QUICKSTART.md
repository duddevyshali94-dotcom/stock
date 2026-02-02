# Quick Start Guide

Get the Real-Time Stock Market System up and running in minutes!

## ✅ Prerequisites Checklist

- [ ] Node.js v16 or higher installed
- [ ] npm installed (comes with Node.js)
- [ ] Supabase account created
- [ ] Git installed

## 🚀 Installation Steps

### Step 1: Verify Installation

Check that all prerequisites are installed:

```bash
node --version    # Should show v16.x or higher
npm --version     # Should show 8.x or higher
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages:
- express (web framework)
- @supabase/supabase-js (database client)
- cors (Cross-Origin Resource Sharing)
- body-parser (request parsing)
- dotenv (environment variables)
- axios (HTTP client)
- node-schedule (task scheduling)

### Step 3: Configure Environment

Your `.env` file is already configured with the provided Supabase credentials. Verify it contains:

```env
SUPABASE_URL=https://gxylmqxgoicozjrdbihs.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Step 4: Start the Server

```bash
npm start
```

You should see:

```
Starting Real-Time Stock Market System...
Environment: development
✓ Supabase connection established successfully
✓ Server is running on port 5000
✓ Health check available at http://localhost:5000/api/health
```

### Step 5: Test the Application

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Step 6: Access the Frontend

Open your browser and navigate to:

```
http://localhost:5000
```

You should see the Real-Time Stock Market System welcome page with a system status indicator showing "Online" in green.

## 🎯 What's Next?

The backend infrastructure is now complete! Here's what happens next in Phase 2:

### Phase 2: Database Schema & API Endpoints

1. **Create Database Tables in Supabase**
   - Users table
   - Stocks table
   - Portfolios table
   - Portfolio holdings table
   - Stock history table
   - Watchlists table

2. **Implement API Endpoints**
   - Authentication (register, login, logout)
   - Stock operations (list, search, details, history)
   - Portfolio management (CRUD operations)
   - Watchlist management
   - User management (admin only)

3. **Add Business Logic Services**
   - Stock data fetching service
   - Portfolio calculation service
   - Notification service
   - Scheduled tasks for price updates

## 🛠️ Development Commands

```bash
# Start server normally
npm start

# Start with auto-reload (when available)
npm run dev

# Check for available updates
npm outdated
```

## 📂 Project Structure

```
.
├── backend/
│   └── src/
│       ├── config/          # Supabase configuration
│       ├── middleware/      # Auth & role middleware
│       ├── routes/          # API endpoints (Phase 2)
│       ├── services/        # Business logic (Phase 2)
│       ├── utils/           # Utility functions
│       ├── index.js         # Entry point
│       └── server.js        # Express setup
├── frontend/
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript
│   └── index.html           # Main page
├── .env                     # Environment variables
├── package.json             # Dependencies
└── README.md                # Documentation
```

## 🔧 Troubleshooting

### Server Won't Start

**Error**: `Error: listen EADDRINUSE: address already in use`

**Solution**: Port 5000 is already in use. Either:

1. Stop the process using port 5000:
   ```bash
   # Find the process
   lsof -i :5000
   
   # Kill it
   kill -9 <PID>
   ```

2. Or change the port in `.env`:
   ```env
   PORT=5001
   ```

### Supabase Connection Error

**Error**: Connection to Supabase fails

**Solution**:
1. Verify your Supabase credentials in `.env`
2. Check that your Supabase project is active
3. Ensure you have internet connectivity
4. See [SETUP.md](SETUP.md) for detailed Supabase configuration

### npm install Fails

**Error**: Dependencies fail to install

**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Delete package-lock.json: `rm package-lock.json`
4. Reinstall: `npm install`

### Permission Errors

**Error**: EACCES permission denied

**Solution**:
```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

## 📊 Current Features

### ✅ Implemented (Phase 1)
- Express server with CORS
- Supabase connection and configuration
- JWT authentication middleware
- Role-based access control middleware
- Health check endpoint
- Request logging
- Error handling
- Static file serving
- Basic frontend with system status

### 🔲 Coming in Phase 2
- User registration and login
- Stock data API endpoints
- Portfolio management
- Real-time price updates
- Watchlist functionality
- Admin user management
- Database schema with RLS

## 🔐 Security Notes

- ✅ `.env` file is excluded from git
- ✅ Service role key is server-side only
- ✅ CORS is configured
- ✅ JWT authentication ready
- ✅ Role-based access control ready
- ⏳ Row Level Security (Phase 2)
- ⏳ Input validation (Phase 2)
- ⏳ Rate limiting (Phase 2)

## 📝 API Documentation (Current)

### GET /api/health

Check server status

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

More endpoints will be documented in Phase 2.

## 🤝 Need Help?

- Check [README.md](README.md) for detailed documentation
- See [SETUP.md](SETUP.md) for Supabase configuration
- Review [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture details

## ✨ Success!

If you've completed all steps and the health check works, you're ready for Phase 2!

**What's Working:**
- ✅ Backend server running on port 5000
- ✅ Supabase connection established
- ✅ Frontend accessible at http://localhost:5000
- ✅ Health check endpoint responding
- ✅ All middleware configured
- ✅ Environment variables loaded

**Next Steps:**
1. Keep the server running
2. Proceed to Phase 2 for database schema creation
3. Implement API endpoints
4. Build out the frontend

Happy coding! 🚀
