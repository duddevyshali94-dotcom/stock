# Deployment Guide

This guide provides step-by-step instructions for deploying the AI-Powered Real-Time Stock Market System to various production environments.

## 🚀 Pre-Deployment Checklist

### Environment Configuration
- [ ] Production environment variables configured
- [ ] Supabase production database setup
- [ ] SSL certificates obtained
- [ ] Domain name configured
- [ ] External API keys (Alpha Vantage) secured

### Security Checklist
- [ ] Environment variables not committed to git
- [ ] Database Row Level Security (RLS) enabled
- [ ] CORS properly configured for production
- [ ] Rate limiting implemented
- [ ] JWT secret properly configured

### Performance Checklist
- [ ] Database indexes created for optimal query performance
- [ ] Static assets minified and compressed
- [ ] CDN configured for static assets (optional)
- [ ] Monitoring and logging configured

## 🌐 Deployment Platforms

### Option 1: Heroku Deployment

#### Prerequisites
- Heroku account
- Heroku CLI installed
- Git repository

#### Step 1: Prepare for Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=5000
heroku config:set SUPABASE_URL=your_production_supabase_url
heroku config:set SUPABASE_ANON_KEY=your_production_anon_key
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
heroku config:set ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
heroku config:set LOG_LEVEL=INFO
```

#### Step 2: Configure Build Process
Create `Procfile` in the root directory:
```
web: npm start
```

Update `package.json`:
```json
{
  "scripts": {
    "start": "node backend/src/index.js",
    "build": "echo 'Build step completed'"
  },
  "engines": {
    "node": "16.x"
  }
}
```

#### Step 3: Deploy
```bash
# Add Heroku remote (if not done automatically)
git remote add heroku https://git.heroku.com/your-app-name.git

# Deploy to Heroku
git push heroku main
```

#### Step 4: Verify Deployment
```bash
# Check logs
heroku logs --tail

# Open application
heroku open
```

### Option 2: Render Deployment

#### Step 1: Connect Repository
1. Create account at [Render](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service

#### Step 2: Configure Build Settings
- **Runtime**: Node.js
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node

#### Step 3: Set Environment Variables
In the Render dashboard, add:
```
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
LOG_LEVEL=INFO
```

#### Step 4: Deploy
- Click "Create Web Service"
- Wait for build and deployment
- Access your application at the provided URL

### Option 3: DigitalOcean Droplet

#### Step 1: Create Droplet
1. Create DigitalOcean account
2. Create new Droplet (Ubuntu 20.04+)
3. Choose appropriate size (minimum 2GB RAM)
4. Add SSH key for secure access

#### Step 2: Server Setup
```bash
# Connect to droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install nginx -y

# Install other dependencies
apt install git curl -y
```

#### Step 3: Application Deployment
```bash
# Clone repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install --production

# Create environment file
cp .env.example .env
nano .env
# Edit with production values

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 4: PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'stock-market-system',
    script: 'backend/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### Step 5: Nginx Configuration
Create `/etc/nginx/sites-available/stock-market`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/stock-market /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### Step 6: SSL Setup with Let's Encrypt
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com

# Verify auto-renewal
certbot renew --dry-run
```

### Option 4: AWS EC2 Deployment

#### Step 1: Create EC2 Instance
1. Launch EC2 instance (Ubuntu 20.04)
2. Configure security group (allow HTTP, HTTPS, SSH)
3. Create or use existing key pair
4. Launch instance

#### Step 2: Instance Setup
```bash
# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install other dependencies
sudo apt install git curl -y
```

#### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
sudo nano .env
# Add production values

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

#### Step 4: Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stock-market
```

Use the same Nginx configuration as DigitalOcean deployment.

#### Step 5: SSL with AWS Certificate Manager
1. Request SSL certificate in AWS Certificate Manager
2. Configure Elastic Load Balancer (optional)
3. Update security groups
4. Configure domain DNS

### Option 5: Google Cloud Platform

#### Step 1: Create GCP Project
1. Create new GCP project
2. Enable required APIs (App Engine, Cloud SQL)
3. Set up billing account

#### Step 2: Deploy with App Engine
Create `app.yaml`:
```yaml
runtime: nodejs16

env_variables:
  NODE_ENV: production
  SUPABASE_URL: your_supabase_url
  SUPABASE_ANON_KEY: your_supabase_anon_key
  SUPABASE_SERVICE_ROLE_KEY: your_supabase_service_role_key
  ALPHA_VANTAGE_API_KEY: your_alpha_vantage_key
  LOG_LEVEL: INFO

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

Deploy:
```bash
# Install Google Cloud SDK
# Initialize gcloud
gcloud app deploy
```

## 🗄️ Database Setup

### Supabase Production Configuration

#### Step 1: Create Production Project
1. Create new Supabase project for production
2. Configure project settings
3. Set up billing (if required)

#### Step 2: Database Schema
Run the following SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own portfolios" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- Additional policies for other tables...
```

#### Step 3: Create Indexes
```sql
-- Performance indexes
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_holdings_portfolio_id ON portfolio_holdings(portfolio_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_stocks_symbol ON stocks(symbol);
```

#### Step 4: Environment Variables
Set in your deployment platform:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔒 Security Configuration

### SSL/TLS Setup

#### Let's Encrypt (Free SSL)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Commercial SSL Certificates
1. Purchase SSL certificate from provider
2. Generate Certificate Signing Request (CSR)
3. Submit CSR to certificate authority
4. Install certificate on server
5. Configure web server

### Firewall Configuration
```bash
# Ubuntu/Debian UFW setup
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw status
```

### Environment Security
```bash
# Secure .env file
chmod 600 .env
chown $USER:$USER .env

# Never commit .env to git
echo ".env" >> .gitignore
```

## 📊 Monitoring & Logging

### Application Monitoring

#### PM2 Monitoring
```bash
# Monitor application
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart all

# View status
pm2 status
```

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Monitor system resources
htop
iotop
nethogs
```

### Log Management

#### Log Rotation
Create `/etc/logrotate.d/stock-market`:
```
/home/ubuntu/your-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### Centralized Logging (Optional)
Configure ELK stack or use cloud logging services:
- AWS CloudWatch
- Google Cloud Logging
- Azure Monitor
- Datadog

## 🔧 Performance Optimization

### Database Optimization

#### Connection Pooling
```javascript
// In database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Query Optimization
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM portfolios WHERE user_id = $1;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_transactions_user_date 
ON transactions(user_id, created_at);
```

### Caching Strategy

#### Redis Setup (Optional)
```bash
# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
# Set requirepass your_password
sudo systemctl restart redis-server
```

#### Application Caching
```javascript
// Add to application
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: 'your_password'
});

// Cache frequently accessed data
async function getCachedData(key) {
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
}
```

### CDN Configuration

#### Cloudflare Setup
1. Create Cloudflare account
2. Add your domain
3. Update DNS records to point to Cloudflare
4. Configure caching rules
5. Enable SSL/TLS encryption

## 🚨 Disaster Recovery

### Backup Strategy

#### Database Backups
```bash
# Automated Supabase backups (automatic)
# Manual backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

#### Code Backups
```bash
# Git repository (primary)
git push origin main

# Additional backup locations
git remote add backup https://github.com/backup/your-repo.git
git push backup main
```

#### Configuration Backups
```bash
# Backup environment configurations
cp .env .env.backup.$(date +%Y%m%d)
aws s3 cp .env.backup.* s3://your-config-bucket/
```

### Recovery Procedures

#### Application Recovery
1. Identify issue
2. Check application logs
3. Review error tracking
4. Implement fix
5. Deploy fix
6. Verify functionality

#### Database Recovery
1. Stop application
2. Restore from backup
3. Verify data integrity
4. Update configuration if needed
5. Start application
6. Test functionality

## 📈 Scaling

### Horizontal Scaling

#### Load Balancer Setup
```nginx
# Nginx load balancer configuration
upstream stock_market_app {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://stock_market_app;
    }
}
```

#### Multiple PM2 Instances
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'stock-market-app',
    script: 'backend/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### Vertical Scaling

#### Server Upgrade
- Monitor resource usage
- Plan upgrade based on metrics
- Schedule maintenance window
- Upgrade server resources
- Verify performance improvement

## 🔍 Post-Deployment Verification

### Health Checks
```bash
# Application health check
curl -f http://your-domain.com/api/health

# Database connectivity
curl -f http://your-domain.com/api/guidance/health

# External API connectivity
curl -f http://your-domain.com/api/stocks/AAPL
```

### Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API endpoints
ab -n 1000 -c 10 http://your-domain.com/api/stocks

# Test static assets
ab -n 1000 -c 10 http://your-domain.com/css/styles.css
```

### Security Testing
```bash
# Check SSL configuration
ssl-cert-check -c your-domain.com

# Test security headers
curl -I http://your-domain.com

# Scan for vulnerabilities (install nmap)
nmap -sS -O your-domain.com
```

## 🐛 Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs

# Check environment variables
env | grep SUPABASE

# Test database connection
node -e "console.log(process.env.SUPABASE_URL)"
```

#### Database Connection Issues
```bash
# Test Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/users?select=count"
```

#### SSL Certificate Problems
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Emergency Contacts
- Technical Support: support@yourdomain.com
- Database Issues: dba@yourdomain.com
- Security Issues: security@yourdomain.com
- Emergency Hotline: +1-XXX-XXX-XXXX

## 📚 Additional Resources

### Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [Node.js Deployment Guide](https://nodejs.org/en/docs/guides/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Monitoring Tools
- [UptimeRobot](https://uptimerobot.com/) - Uptime monitoring
- [Pingdom](https://www.pingdom.com/) - Performance monitoring
- [New Relic](https://newrelic.com/) - Application performance monitoring
- [Sentry](https://sentry.io/) - Error tracking

### Security Tools
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL configuration testing
- [OWASP](https://owasp.org/) - Security best practices
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL certificates

---

**Congratulations!** Your AI-Powered Real-Time Stock Market System is now deployed and ready for production use. Remember to monitor your application regularly and keep all dependencies updated for optimal performance and security.