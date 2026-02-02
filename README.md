# Real-Time Stock Market System

A comprehensive real-time stock market tracking and portfolio management system built with Node.js, Express, and Supabase.

## 🚀 Features

- **Real-time Stock Tracking**: Monitor stock prices and market data in real-time
- **Portfolio Management**: Create and manage your investment portfolio
- **User Authentication**: Secure user registration and login with Supabase Auth
- **Role-Based Access Control**: Admin and user roles with different permissions
- **RESTful API**: Clean and well-documented API endpoints
- **Responsive Frontend**: Modern, mobile-friendly user interface

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up here](https://supabase.com/)

## 🛠️ Installation

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

Copy the example environment file:

```bash
cp .env.example .env
```

Then edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### 4. Supabase Setup

See [SETUP.md](SETUP.md) for detailed instructions on setting up your Supabase project.

## 🚀 Running the Application

### Development Mode

Start the backend server:

```bash
npm start
```

The server will start on `http://localhost:5000`

### Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

## 🧪 Testing

### Health Check

Test that the server is running:

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

## 📁 Project Structure

```
real-time-stock-market-system/
├── backend/
│   └── src/
│       ├── config/          # Configuration files
│       │   └── supabase.js  # Supabase client setup
│       ├── middleware/      # Express middleware
│       │   ├── authMiddleware.js    # JWT authentication
│       │   └── roleMiddleware.js    # Role-based access control
│       ├── routes/          # API routes (Phase 2)
│       ├── services/        # Business logic (Phase 2)
│       ├── utils/           # Utility functions
│       ├── index.js         # Application entry point
│       └── server.js        # Express server setup
├── frontend/
│   ├── css/
│   │   └── styles.css       # Application styles
│   ├── js/
│   │   └── main.js          # Frontend JavaScript
│   ├── assets/              # Images and static files
│   └── index.html           # Main HTML page
├── .env                     # Environment variables (not in git)
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── package.json             # Node.js dependencies
├── README.md                # This file
└── SETUP.md                 # Detailed setup instructions
```

## 🔧 API Endpoints

### Health Check

- **GET** `/api/health` - Check server status

More endpoints will be added in Phase 2.

## 🔐 Authentication

The system uses Supabase Authentication with JWT tokens. Protected routes require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 👥 User Roles

- **User**: Can view stocks, manage their own portfolio
- **Admin**: Full access including user management and system configuration

## 🛡️ Security Features

- Environment variables for sensitive data
- JWT token-based authentication
- Role-based access control (RBAC)
- CORS protection
- Input validation and sanitization

## 📝 Development Workflow

### Phase 1 (Current) - Infrastructure Setup ✅
- Backend structure
- Supabase configuration
- Authentication middleware
- Basic frontend

### Phase 2 (Next) - Database & API
- Database schema design
- API endpoints implementation
- Stock data integration
- Portfolio management

### Phase 3 - Frontend Development
- User interface components
- Real-time updates
- Dashboard and charts

### Phase 4 - Advanced Features
- Notifications
- Analytics
- Advanced portfolio features

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Server won't start

- Check that all dependencies are installed: `npm install`
- Verify `.env` file exists and contains valid Supabase credentials
- Ensure port 5000 is not already in use

### Supabase connection fails

- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active
- See [SETUP.md](SETUP.md) for detailed configuration steps

### CORS errors

- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check that CORS is properly configured in `server.js`

## 📧 Support

For issues and questions, please open an issue on the GitHub repository.

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend as a Service
- [Express](https://expressjs.com/) - Web framework
- [Node.js](https://nodejs.org/) - Runtime environment
