# Detailed Setup & Supabase Configuration

This document provides detailed steps to configure the project and Supabase.

## Supabase Configuration

The project is pre-configured with the following Supabase details:

- **Project URL**: `https://gxylmqxgoicozjrdbihs.supabase.co`
- **Anon Key**: Provided in `.env`
- **Service Role Key**: Provided in `.env`

### Environment Variables

The following variables are required in your `.env` file at the root of the project:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role API key |
| `PORT` | Port for the Express server (default: 5000) |
| `NODE_ENV` | Environment mode (development/production) |
| `FRONTEND_URL` | URL of the frontend application |

## Backend Infrastructure

### Entry Point
`backend/src/index.js` loads environment variables and starts the Express server.

### Server Configuration
`backend/src/server.js` initializes Express, adds standard middleware (CORS, Body-Parser), and sets up a health check endpoint.

### Supabase Client
`backend/src/config/supabase.js` initializes the Supabase client using the provided service role key to allow administrative operations when needed.

### Middleware
- `authMiddleware.js`: Verifies JWT tokens sent in the `Authorization` header.
- `roleMiddleware.js`: Handles Role-Based Access Control (RBAC).

## Next Steps (Phase 2)
In the next phase, we will:
1. Define the database schema (stocks, portfolios, transactions).
2. Implement user profiles and role management in the database.
3. Create API routes for stock data fetching and portfolio management.
4. Implement real-time updates using Supabase Realtime or scheduled tasks.
