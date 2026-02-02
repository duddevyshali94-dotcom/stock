# Supabase Setup Guide

This guide will walk you through setting up your Supabase project for the Real-Time Stock Market System.

## 📋 Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your Supabase project URL and API keys

## 🔑 Getting Your Supabase Credentials

### 1. Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: Real-Time Stock Market System
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
4. Click "Create new project"

### 2. Get Your API Keys

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll find:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public key**: Used for client-side requests
   - **service_role key**: Used for server-side admin operations (keep this secret!)

### 3. Configure Environment Variables

Copy these values to your `.env` file:

```env
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

## 🗄️ Database Schema (Phase 2)

The following tables will be created in Phase 2:

### Users Table
```sql
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Stocks Table
```sql
create table stocks (
  id uuid primary key default uuid_generate_v4(),
  symbol text unique not null,
  name text not null,
  current_price decimal(10,2),
  previous_close decimal(10,2),
  change_percent decimal(5,2),
  volume bigint,
  market_cap bigint,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);
```

### Portfolios Table
```sql
create table portfolios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Portfolio Holdings Table
```sql
create table portfolio_holdings (
  id uuid primary key default uuid_generate_v4(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  stock_id uuid references stocks(id) on delete cascade,
  quantity integer not null,
  purchase_price decimal(10,2) not null,
  purchase_date timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### Stock History Table
```sql
create table stock_history (
  id uuid primary key default uuid_generate_v4(),
  stock_id uuid references stocks(id) on delete cascade,
  price decimal(10,2) not null,
  volume bigint,
  timestamp timestamp with time zone default now()
);
```

### Watchlists Table
```sql
create table watchlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  stock_id uuid references stocks(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, stock_id)
);
```

## 🔒 Row Level Security (RLS)

Enable Row Level Security on all tables in Phase 2:

```sql
-- Enable RLS
alter table users enable row level security;
alter table portfolios enable row level security;
alter table portfolio_holdings enable row level security;
alter table watchlists enable row level security;

-- Users can read their own data
create policy "Users can view own data"
  on users for select
  using (auth.uid() = id);

-- Users can update their own data
create policy "Users can update own data"
  on users for update
  using (auth.uid() = id);

-- Users can view all stocks (public data)
create policy "Anyone can view stocks"
  on stocks for select
  to authenticated
  using (true);

-- Users can manage their own portfolios
create policy "Users can manage own portfolios"
  on portfolios for all
  using (auth.uid() = user_id);

-- Users can manage their own portfolio holdings
create policy "Users can manage own holdings"
  on portfolio_holdings for all
  using (
    auth.uid() = (
      select user_id from portfolios
      where id = portfolio_holdings.portfolio_id
    )
  );

-- Users can manage their own watchlists
create policy "Users can manage own watchlists"
  on watchlists for all
  using (auth.uid() = user_id);
```

## 🔐 Authentication Setup

### Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### Email Templates (Optional)

Customize the email templates for:
- Confirmation emails
- Password reset emails
- Magic link emails

## 🎯 Testing Your Setup

### 1. Test Database Connection

The server will automatically test the connection on startup. Look for:

```
✓ Supabase connection established successfully
```

### 2. Test Health Endpoint

```bash
curl http://localhost:5000/api/health
```

### 3. Create a Test User (Phase 2)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'
```

## 🛠️ Advanced Configuration

### API Rate Limiting

Configure rate limits in Supabase:

1. Go to **Project Settings** → **API**
2. Adjust rate limits based on your needs

### Custom Domain (Production)

1. Go to **Project Settings** → **Custom Domains**
2. Follow the instructions to set up your custom domain

### Monitoring and Logs

1. Go to **Database** → **Logs**
2. Monitor database queries and performance
3. Set up alerts for errors

## 🔄 Database Migrations

For Phase 2 and beyond, use Supabase migrations:

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

4. Create migrations:
   ```bash
   supabase migration new <migration-name>
   ```

## 📊 Performance Optimization

### Indexes (Phase 2)

Create indexes for frequently queried columns:

```sql
-- Index on stock symbol for fast lookups
create index idx_stocks_symbol on stocks(symbol);

-- Index on user portfolios
create index idx_portfolios_user_id on portfolios(user_id);

-- Index on stock history for time-series queries
create index idx_stock_history_timestamp on stock_history(stock_id, timestamp desc);
```

### Connection Pooling

Supabase handles connection pooling automatically, but you can adjust settings:

1. Go to **Project Settings** → **Database**
2. Adjust connection pool size based on your needs

## 🚨 Troubleshooting

### Connection Issues

- Verify your project URL is correct
- Check that your API keys are valid
- Ensure your Supabase project is not paused

### Authentication Errors

- Verify email authentication is enabled
- Check that your email templates are configured
- Ensure SMTP settings are correct (if using custom email)

### Database Errors

- Check your database password is correct
- Verify tables are created correctly
- Ensure RLS policies are not blocking legitimate requests

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🔐 Security Best Practices

1. **Never commit** `.env` file to version control
2. **Rotate** your service role key regularly
3. **Enable** Row Level Security on all tables
4. **Use** the anon key for client-side requests only
5. **Keep** the service role key server-side only
6. **Monitor** your database logs for suspicious activity
7. **Set up** rate limiting to prevent abuse
8. **Use** strong passwords for all accounts
9. **Enable** 2FA on your Supabase account
10. **Review** RLS policies regularly

## ✅ Next Steps

Once your Supabase project is set up:

1. ✅ Verify connection in server logs
2. ✅ Test health endpoint
3. 🔲 Proceed to Phase 2 for database schema creation
4. 🔲 Implement API endpoints
5. 🔲 Build frontend components

---

**Need help?** Check the [main README](README.md) or open an issue on GitHub.
