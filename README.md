# AI-Powered Real-Time Stock Market System

A comprehensive stock market investment platform with AI-powered guidance, real-time price tracking, portfolio management, and educational resources designed for beginner investors.

## 🚀 Features

### Core Functionality
- **Real-Time Stock Price Tracking**: Live stock prices with 30-second updates
- **Portfolio Management**: Create, manage, and track multiple investment portfolios
- **AI Investment Guidance**: Intelligent recommendations based on technical analysis
- **Beginner-Friendly Interface**: Educational content and simplified explanations
- **Role-Based Access Control**: Admin and user roles with appropriate permissions
- **Secure Authentication**: JWT-based authentication with Supabase

### AI Guidance System
- **Portfolio Analysis**: Comprehensive analysis of portfolio health and diversification
- **Stock Recommendations**: Buy/Hold/Sell signals with confidence scores
- **Technical Analysis**: RSI, Moving Averages, Bollinger Bands, MACD indicators
- **Risk Assessment**: Automated risk scoring and management suggestions
- **Educational Tips**: Personalized learning content based on user profile
- **Market Insights**: AI-powered market sentiment and trend analysis

### Analytics & Monitoring
- **User Analytics**: Trading patterns, win rates, and performance metrics
- **Platform Metrics**: System health, user engagement, and growth tracking
- **Guidance Effectiveness**: Track AI recommendation success rates
- **Performance Monitoring**: Real-time system health and API response times

## 🏗️ Architecture

### Backend (Node.js/Express)
- **API Endpoints**: RESTful API with comprehensive stock and portfolio management
- **AI Services**: Modular AI guidance system with technical analysis
- **Database Integration**: Supabase for authentication and data storage
- **Real-Time Updates**: Scheduled price updates and real-time notifications
- **Security**: JWT authentication, role-based access control, input validation

### Frontend (HTML/CSS/JavaScript)
- **Responsive Design**: Mobile-first responsive interface
- **Real-Time Updates**: Live price updates and portfolio changes
- **Interactive Components**: Modern UI with smooth animations
- **Educational Interface**: Beginner-friendly guidance and tips
- **Dashboard**: Comprehensive investment dashboard with AI insights

### Database (Supabase)
- **User Management**: Secure user authentication and profiles
- **Stock Data**: Real-time stock prices and historical data
- **Portfolio Tracking**: Holdings, transactions, and performance
- **Analytics Storage**: User activity and guidance feedback data
- **Row Level Security**: Database-level security policies

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm (v8 or higher)
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd real-time-stock-market-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the example environment file and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# External APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# Logging
LOG_LEVEL=INFO
```

### 4. Database Setup
The system will automatically create the necessary tables and policies when first run. Ensure your Supabase project is configured with:
- Database tables for users, stocks, portfolios, transactions
- Row Level Security (RLS) policies
- Proper indexes for performance

### 5. Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at:
- Frontend: http://localhost:5000
- API Health Check: http://localhost:5000/api/health
- API Documentation: http://localhost:5000/api/docs

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/register - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/auth/me - Get current user
GET /api/auth/verify - Verify token
```

### Stock Management
```
GET /api/stocks - List all stocks
GET /api/stocks/search - Search stocks
GET /api/stocks/:symbol - Get stock details
GET /api/stocks/:symbol/history - Get price history
```

### Portfolio Management
```
GET /api/portfolios - List user portfolios
POST /api/portfolios - Create portfolio
GET /api/portfolios/:id - Get portfolio details
PUT /api/portfolios/:id - Update portfolio
DELETE /api/portfolios/:id - Delete portfolio

GET /api/portfolios/:id/holdings - Get holdings
POST /api/portfolios/:id/holdings - Add holding
PUT /api/portfolios/:id/holdings/:holdingId - Update holding
DELETE /api/portfolios/:id/holdings/:holdingId - Remove holding
```

### AI Guidance Endpoints
```
GET /api/guidance/portfolio - Get portfolio guidance
GET /api/guidance/stock/:symbol - Get stock analysis
GET /api/guidance/beginner-tips - Get educational content
POST /api/guidance/feedback - Submit feedback
GET /api/guidance/dashboard - Get all guidance data
GET /api/guidance/analytics - Get analytics (admin only)
```

### Analytics & Monitoring
```
GET /api/analytics/user/:userId - User metrics
GET /api/analytics/platform - Platform metrics
GET /api/health/detailed - System health check
```

## 🎯 Usage Guide

### For Beginners

1. **Getting Started**
   - Sign up for an account
   - Complete the beginner questionnaire
   - Review educational content

2. **Creating Your First Portfolio**
   - Navigate to Portfolio section
   - Create a new portfolio
   - Add your first stock holdings
   - Review AI recommendations

3. **Using AI Guidance**
   - Check the AI guidance panel for recommendations
   - Review confidence scores and reasoning
   - Take action based on AI suggestions
   - Provide feedback to improve recommendations

4. **Learning Investment Basics**
   - Read educational tips and principles
   - Understand technical indicators
   - Practice with small positions
   - Monitor portfolio performance

### For Advanced Users

1. **Portfolio Analysis**
   - Review detailed risk metrics
   - Analyze diversification opportunities
   - Use technical analysis tools
   - Monitor market insights

2. **Trading Interface**
   - Execute buy/sell orders
   - Set up price alerts
   - Track transaction history
   - Analyze trading performance

### For Administrators

1. **User Management**
   - Monitor user activity
   - Manage user accounts
   - Review platform metrics

2. **System Monitoring**
   - Check system health
   - Monitor API performance
   - Review error logs
   - Track AI guidance effectiveness

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key | No |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/WARN/ERROR) | No |

### Database Configuration

The system automatically sets up the following tables:
- `users` - User profiles and authentication
- `stocks` - Stock information and current prices
- `portfolios` - User portfolio records
- `portfolio_holdings` - Individual stock holdings
- `transactions` - Buy/sell transaction history
- `guidance_feedback` - User feedback on AI recommendations

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
```

### Test Coverage
- Unit tests for all services and utilities
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance tests for real-time features

### Manual Testing Checklist

#### Authentication
- [ ] User registration works
- [ ] Login/logout functionality
- [ ] Token refresh mechanism
- [ ] Role-based access control

#### Portfolio Management
- [ ] Create/edit/delete portfolios
- [ ] Add/remove stock holdings
- [ ] Real-time portfolio value updates
- [ ] Transaction history tracking

#### AI Guidance
- [ ] Portfolio analysis generation
- [ ] Stock recommendation accuracy
- [ ] Educational content delivery
- [ ] Feedback system functionality

#### User Interface
- [ ] Responsive design on all devices
- [ ] Real-time price updates
- [ ] Smooth animations and transitions
- [ ] Error handling and user feedback

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set production environment
   export NODE_ENV=production
   
   # Configure production environment variables
   # Update SUPABASE_URL and API keys for production
   ```

2. **Database Migration**
   ```bash
   # Run database setup scripts
   npm run db:setup
   
   # Apply any pending migrations
   npm run db:migrate
   ```

3. **Build Application**
   ```bash
   # Install production dependencies
   npm ci --production
   
   # Start production server
   npm start
   ```

### Deployment Platforms

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SUPABASE_URL=your_production_url
# ... add other variables

# Deploy
git push heroku main
```

#### Render
1. Connect your GitHub repository
2. Set environment variables in dashboard
3. Configure build and start commands
4. Deploy automatically

#### DigitalOcean/AWS
1. Set up VPS instance
2. Install Node.js and dependencies
3. Configure nginx reverse proxy
4. Set up SSL certificates
5. Configure environment variables
6. Use PM2 for process management

### Monitoring & Maintenance

1. **Health Monitoring**
   - Set up uptime monitoring
   - Configure error tracking (Sentry)
   - Monitor API response times
   - Track user activity metrics

2. **Performance Optimization**
   - Monitor database query performance
   - Optimize API response times
   - Implement caching strategies
   - Regular security updates

3. **Backup Strategy**
   - Automated database backups
   - Code repository backups
   - Environment configuration backups
   - Disaster recovery plan

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Row Level Security**: Database-level access control
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API endpoint protection
- **Environment Security**: Sensitive data protection

### Security Best Practices
- Never commit sensitive credentials
- Use environment variables for configuration
- Regularly update dependencies
- Implement proper error handling
- Use HTTPS in production
- Monitor for security vulnerabilities

## 📊 Performance

### Optimization Features
- **Database Indexing**: Optimized queries for fast data retrieval
- **Caching Strategy**: Client-side caching for improved performance
- **Real-Time Updates**: Efficient WebSocket connections
- **Lazy Loading**: On-demand component loading
- **Minification**: Compressed CSS and JavaScript

### Performance Metrics
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **Real-Time Updates**: 30-second intervals
- **Concurrent Users**: Supports 100+ simultaneous users

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check Supabase connection
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     "$SUPABASE_URL/rest/v1/users?select=count"
```

#### Authentication Problems
- Verify JWT token validity
- Check token expiration times
- Ensure proper CORS configuration

#### Real-Time Updates Not Working
- Check WebSocket connection status
- Verify API endpoints are accessible
- Ensure proper subscription setup

#### AI Guidance Not Generating
- Check API rate limits
- Verify external API connectivity
- Review error logs for specific issues

### Debug Mode
Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
npm run dev
```

### Log Analysis
View application logs:
```bash
# View real-time logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log

# Search for specific issues
grep "ERROR" logs/app.log
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Standards
- Use ESLint for JavaScript code style
- Follow REST API conventions
- Write comprehensive tests
- Document new features
- Use semantic commit messages

### Pull Request Process
1. Update README.md with new features
2. Add tests for new functionality
3. Ensure all tests pass
4. Request code review
5. Address feedback and merge

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

### Getting Help
- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join our community discussions
- **Email**: Contact support at support@example.com

### Feature Requests
We welcome feature requests! Please:
1. Check existing issues to avoid duplicates
2. Describe the feature and its use case
3. Provide mockups or examples if applicable
4. Be patient during the review process

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile application (React Native)
- [ ] Advanced charting tools
- [ ] Social trading features
- [ ] Cryptocurrency support
- [ ] Options and derivatives trading
- [ ] Automated portfolio rebalancing
- [ ] Machine learning price predictions
- [ ] Integration with more data providers

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - AI guidance system implementation
- **v1.2.0** - Enhanced analytics and monitoring
- **v2.0.0** - Mobile application and advanced features (planned)

---

**Built with ❤️ for beginner investors**

This system is designed to make investing accessible and educational for everyone. Whether you're just starting your investment journey or looking to enhance your trading strategies, our AI-powered platform provides the tools and guidance you need to succeed.