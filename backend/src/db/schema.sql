create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  virtual_balance numeric(12,2) not null default 10000.00,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists stocks (
  id uuid primary key default uuid_generate_v4(),
  symbol text unique not null,
  company_name text not null,
  current_price numeric(12,2) not null,
  last_updated timestamp with time zone not null default now(),
  daily_change numeric(12,2) not null default 0,
  daily_change_percent numeric(6,2) not null default 0,
  is_enabled boolean not null default true,
  added_by uuid references users(id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists portfolio (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  stock_id uuid not null references stocks(id) on delete cascade,
  quantity integer not null,
  average_buy_price numeric(12,2) not null,
  total_invested numeric(12,2) not null,
  current_value numeric(12,2) not null,
  profit_loss numeric(12,2) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (user_id, stock_id)
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  stock_id uuid not null references stocks(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('BUY', 'SELL')),
  quantity integer not null,
  price_per_share numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  balance_before numeric(12,2) not null,
  balance_after numeric(12,2) not null,
  transaction_date timestamp with time zone not null default now(),
  notes text
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_role on users(role);
create index if not exists idx_stocks_symbol on stocks(symbol);
create index if not exists idx_stocks_enabled on stocks(is_enabled);
create index if not exists idx_portfolio_user_id on portfolio(user_id);
create index if not exists idx_portfolio_stock_id on portfolio(stock_id);
create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_stock_id on transactions(stock_id);
create index if not exists idx_transactions_date on transactions(transaction_date desc);

alter table users enable row level security;
alter table stocks enable row level security;
alter table portfolio enable row level security;
alter table transactions enable row level security;

create policy "Users can view own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update
  using (auth.uid() = id);

create policy "Admins manage users"
  on users for all
  using (exists (
    select 1 from users as u
    where u.id = auth.uid() and u.role = 'admin'
  ))
  with check (exists (
    select 1 from users as u
    where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "Enabled stocks visible to authenticated"
  on stocks for select
  using (is_enabled = true);

create policy "Admins manage stocks"
  on stocks for all
  using (exists (
    select 1 from users as u
    where u.id = auth.uid() and u.role = 'admin'
  ))
  with check (exists (
    select 1 from users as u
    where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "Users manage own portfolio"
  on portfolio for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
