# API Documentation

## Overview

The AI-Powered Real-Time Stock Market System provides a comprehensive REST API for managing portfolios, analyzing stocks, and receiving AI-powered investment guidance. This documentation covers all available endpoints, request/response formats, authentication requirements, and example usage.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:5000/api
```

## Authentication

All API endpoints (except public endpoints) require authentication using JWT tokens.

### Authentication Header
```
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle
- **Access Token**: Valid for 30 minutes
- **Refresh Token**: Valid for 7 days
- **Renewal**: Use `/auth/refresh` endpoint

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Common Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Request data validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

#### Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "full_name": "John Doe",
  "investment_experience": "beginner",
  "risk_tolerance": "moderate"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "investment_experience": "beginner",
      "risk_tolerance": "moderate"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Email already registered",
  "code": "EMAIL_EXISTS",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /auth/login

Authenticate user and receive access token.

#### Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /auth/logout

Invalidate current access token.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /auth/me

Get current user information.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "user@example.com",
      "full_name": "John Doe",
      "investment_experience": "beginner",
      "risk_tolerance": "moderate",
      "created_at": "2024-01-01T00:00:00Z",
      "last_sign_in_at": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

#### Request
```json
{
  "refresh_token": "refresh-token-string"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "token": "new-access-token-string",
    "expires_in": 1800
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Stock Endpoints

### GET /stocks

Retrieve list of available stocks.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| page | integer | Page number | 1 |
| limit | integer | Items per page | 50 |
| search | string | Search by symbol or name | - |
| sector | string | Filter by sector | - |
| market_cap_min | number | Minimum market cap | - |
| market_cap_max | number | Maximum market cap | - |

#### Response
```json
{
  "success": true,
  "data": {
    "stocks": [
      {
        "id": "1",
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "current_price": 150.25,
        "price_change": 2.15,
        "price_change_percent": 1.45,
        "market_cap": 2500000000000,
        "sector": "Technology",
        "volume": 45678900,
        "pe_ratio": 25.4,
        "dividend_yield": 0.5
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1000,
      "pages": 20
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /stocks/:symbol

Get detailed information for a specific stock.

#### Response
```json
{
  "success": true,
  "data": {
    "stock": {
      "id": "1",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "current_price": 150.25,
      "price_change": 2.15,
      "price_change_percent": 1.45,
      "previous_close": 148.10,
      "open": 149.50,
      "high": 151.00,
      "low": 149.25,
      "volume": 45678900,
      "market_cap": 2500000000000,
      "pe_ratio": 25.4,
      "pb_ratio": 8.2,
      "dividend_yield": 0.5,
      "eps": 5.92,
      "beta": 1.25,
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "description": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
      "website": "https://www.apple.com",
      "ceo": "Tim Cook",
      "employees": 164000,
      "founded": 1976,
      "headquarters": "Cupertino, CA"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /stocks/:symbol/history

Get historical price data for a stock.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| period | string | Data period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max) | 1y |
| interval | string | Data interval (1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo) | 1d |

#### Response
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "period": "1y",
    "interval": "1d",
    "data": [
      {
        "date": "2024-01-15",
        "open": 148.10,
        "high": 151.00,
        "low": 149.25,
        "close": 150.25,
        "volume": 45678900,
        "adjusted_close": 150.25
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /stocks/search

Search stocks by symbol or name.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| limit | integer | Maximum results |

#### Response
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "exchange": "NASDAQ",
        "type": "stock"
      },
      {
        "symbol": "AAP",
        "name": "Advance Auto Parts Inc.",
        "exchange": "NYSE",
        "type": "stock"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Portfolio Endpoints

### GET /portfolios

Get list of user's portfolios.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolios": [
      {
        "id": "portfolio-123",
        "name": "Growth Portfolio",
        "description": "High-growth technology stocks",
        "total_value": 50000.00,
        "total_cost": 45000.00,
        "total_gain_loss": 5000.00,
        "total_gain_loss_percent": 11.11,
        "holdings_count": 10,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /portfolios

Create a new portfolio.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Request
```json
{
  "name": "Growth Portfolio",
  "description": "High-growth technology stocks",
  "initial_capital": 10000.00,
  "risk_level": "moderate",
  "target_allocation": {
    "Technology": 40,
    "Healthcare": 25,
    "Financial": 20,
    "Consumer": 15
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "id": "portfolio-456",
      "name": "Growth Portfolio",
      "description": "High-growth technology stocks",
      "initial_capital": 10000.00,
      "risk_level": "moderate",
      "total_value": 10000.00,
      "total_cost": 10000.00,
      "total_gain_loss": 0.00,
      "total_gain_loss_percent": 0.00,
      "holdings_count": 0,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /portfolios/:id

Get detailed portfolio information.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "id": "portfolio-123",
      "name": "Growth Portfolio",
      "description": "High-growth technology stocks",
      "total_value": 50000.00,
      "total_cost": 45000.00,
      "total_gain_loss": 5000.00,
      "total_gain_loss_percent": 11.11,
      "holdings_count": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z",
      "holdings": [
        {
          "id": "holding-789",
          "stock": {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "current_price": 150.25
          },
          "quantity": 100,
          "average_cost": 145.00,
          "current_value": 15025.00,
          "gain_loss": 525.00,
          "gain_loss_percent": 3.62,
          "weight": 30.05,
          "purchase_date": "2024-01-01T00:00:00Z"
        }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### PUT /portfolios/:id

Update portfolio information.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Request
```json
{
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "risk_level": "aggressive"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "id": "portfolio-123",
      "name": "Updated Portfolio Name",
      "description": "Updated description",
      "risk_level": "aggressive",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### DELETE /portfolios/:id

Delete a portfolio.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": "Portfolio deleted successfully"
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

---

## Holdings Endpoints

### GET /portfolios/:id/holdings

Get holdings for a specific portfolio.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "id": "holding-789",
        "stock": {
          "symbol": "AAPL",
          "name": "Apple Inc.",
          "current_price": 150.25,
          "sector": "Technology"
        },
        "quantity": 100,
        "average_cost": 145.00,
        "current_value": 15025.00,
        "gain_loss": 525.00,
        "gain_loss_percent": 3.62,
        "weight": 30.05,
        "purchase_date": "2024-01-01T00:00:00Z",
        "last_updated": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /portfolios/:id/holdings

Add a new holding to the portfolio.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Request
```json
{
  "stock_symbol": "AAPL",
  "quantity": 100,
  "purchase_price": 145.00,
  "purchase_date": "2024-01-01T00:00:00Z",
  "fees": 9.99,
  "notes": "Long-term growth investment"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "holding": {
      "id": "holding-789",
      "stock": {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "current_price": 150.25
      },
      "quantity": 100,
      "average_cost": 145.00,
      "current_value": 15025.00,
      "gain_loss": 525.00,
      "gain_loss_percent": 3.62,
      "weight": 30.05,
      "purchase_date": "2024-01-01T00:00:00Z",
      "created_at": "2024-01-15T10:35:00Z"
    }
  },
  "timestamp": "2024-01-15T10:35:00Z"
}
```

### PUT /portfolios/:id/holdings/:holdingId

Update an existing holding.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Request
```json
{
  "quantity": 150,
  "average_cost": 142.50,
  "notes": "Increased position"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "holding": {
      "id": "holding-789",
      "quantity": 150,
      "average_cost": 142.50,
      "current_value": 22537.50,
      "gain_loss": 1237.50,
      "gain_loss_percent": 5.82,
      "updated_at": "2024-01-15T10:40:00Z"
    }
  },
  "timestamp": "2024-01-15T10:40:00Z"
}
```

### DELETE /portfolios/:id/holdings/:holdingId

Remove a holding from the portfolio.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "message": "Holding removed successfully"
  },
  "timestamp": "2024-01-15T10:40:00Z"
}
```

---

## AI Guidance Endpoints

### GET /guidance/portfolio

Get AI-generated portfolio guidance.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolio_summary": {
      "total_value": 50000.00,
      "total_cost": 45000.00,
      "total_gain_loss": 5000.00,
      "total_gain_loss_percent": 11.11
    },
    "recommendations": [
      {
        "stock": {
          "symbol": "AAPL",
          "name": "Apple Inc."
        },
        "recommendation": "BUY",
        "reasoning": "Strong uptrend with RSI showing oversold conditions. Portfolio underweight in technology sector.",
        "confidence": 0.85,
        "target_price": 165.00,
        "current_position": 100,
        "current_value": 15025.00
      }
    ],
    "risk_assessment": {
      "riskLevel": "medium",
      "metrics": {
        "value_at_risk": 2500.00,
        "sharpe_ratio": 1.25,
        "volatility": 0.18
      },
      "recommendations": [
        "Consider adding defensive stocks to reduce volatility"
      ]
    },
    "diversification_analysis": {
      "diversificationScore": 75,
      "recommendations": [
        "Add exposure to healthcare sector"
      ],
      "sectorAllocation": {
        "Technology": 45.2,
        "Healthcare": 12.8,
        "Financial": 25.5,
        "Consumer": 16.5
      }
    },
    "insights": [
      "Your portfolio is performing well with strong gains",
      "Consider reducing concentration in technology sector"
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /guidance/stock/:symbol

Get AI analysis for a specific stock.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "stock": {
      "symbol": "AAPL"
    },
    "recommendation": "BUY",
    "confidence": 0.85,
    "reasoning": "Strong uptrend with RSI showing oversold conditions. Positive momentum with increasing volume.",
    "target_price": 165.00,
    "analysis": {
      "trend": "uptrend",
      "momentum": "bullish",
      "volatility": 0.15,
      "rsi": 65.2,
      "support_level": 145.00,
      "resistance_level": 155.00,
      "price_change_percent": 1.45
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /guidance/beginner-tips

Get educational content for beginners.

#### Response
```json
{
  "success": true,
  "data": {
    "tips": [
      {
        "title": "Start with Diversification",
        "description": "Don't put all your money in one stock. Spread investments across different sectors and asset types.",
        "level": "beginner"
      },
      {
        "title": "Understand Dollar-Cost Averaging",
        "description": "Invest a fixed amount regularly regardless of market conditions to reduce timing risk.",
        "level": "beginner"
      }
    ],
    "educationalContent": {
      "investmentPrinciples": [
        "Never invest more than you can afford to lose",
        "Diversification reduces risk",
        "Long-term investing often outperforms short-term trading"
      ],
      "readingMarketData": [
        "P/E Ratio: Price-to-earnings ratio indicates stock valuation",
        "Volume: Shows market interest in a stock",
        "Moving Averages: Help identify price trends"
      ],
      "riskManagement": [
        "Set a budget for investing",
        "Diversify across sectors",
        "Use stop-loss orders"
      ]
    },
    "marketInsights": {
      "marketSentiment": "Neutral",
      "topSectors": ["Technology", "Healthcare", "Financials"],
      "mostVolatile": ["TSLA", "GME", "AMC"],
      "trendingUp": ["AAPL", "MSFT", "GOOGL"]
    },
    "isPersonalized": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /guidance/feedback

Submit feedback on AI recommendations.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Request
```json
{
  "recommendation_type": "stock_analysis",
  "helpful": true,
  "acted_upon": false,
  "successful": true,
  "rating": 4,
  "comments": "The AI analysis was helpful but timing could have been better."
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "feedback-123",
    "message": "Feedback recorded successfully"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /guidance/dashboard

Get complete guidance dashboard data.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "portfolio_guidance": {
      "portfolio_summary": { /* portfolio summary data */ },
      "recommendations": [ /* recommendations array */ ],
      "risk_assessment": { /* risk assessment */ },
      "diversification_analysis": { /* diversification data */ }
    },
    "beginner_guidance": {
      "tips": [ /* educational tips */ ],
      "marketInsights": { /* market insights */ },
      "riskAssessment": { /* risk assessment */ }
    },
    "user_analytics": {
      "total_trades": 25,
      "win_rate": 68.5,
      "average_holding_period_days": 45,
      "most_traded_stocks": [
        {"symbol": "AAPL", "trade_count": 8},
        {"symbol": "MSFT", "trade_count": 5}
      ]
    },
    "system_health": {
      "status": "healthy",
      "overallScore": 95,
      "checks": {
        "database": {"status": "passed", "responseTime": 45},
        "api_performance": {"status": "passed", "responseTime": 120}
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Analytics Endpoints

### GET /analytics/user/:userId

Get user-specific analytics metrics.

#### Headers
```
Authorization: Bearer <valid-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "total_trades": 25,
    "buy_trades": 15,
    "sell_trades": 10,
    "win_rate": 68.5,
    "average_holding_period_days": 45,
    "most_traded_stocks": [
      {"symbol": "AAPL", "trade_count": 8},
      {"symbol": "MSFT", "trade_count": 5}
    ],
    "total_trading_volume": 125000.00,
    "number_of_portfolios": 3,
    "account_age_days": 120,
    "trading_frequency": 2.1,
    "risk_score": 65
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /analytics/platform

Get platform-wide analytics (Admin only).

#### Headers
```
Authorization: Bearer <admin-token>
```

#### Response
```json
{
  "success": true,
  "data": {
    "total_registered_users": 10000,
    "active_users_7_days": 2500,
    "total_trading_volume": 50000000.00,
    "average_portfolio_value": 25000.00,
    "total_trades": 150000,
    "most_traded_stocks": [
      {"symbol": "AAPL", "trade_count": 15000},
      {"symbol": "TSLA", "trade_count": 12000}
    ],
    "total_stocks_available": 5000,
    "total_portfolios": 8500,
    "platform_health": {
      "overall_score": 98,
      "uptime_percentage": 99.9,
      "average_response_time": 120,
      "error_rate": 0.1
    },
    "growth_metrics": {
      "user_growth_monthly": 500,
      "user_growth_weekly": 125,
      "total_users": 10000,
      "current_month_volume": 5000000.00,
      "growth_trend": "positive"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Health Check Endpoints

### GET /health

Basic health check endpoint.

#### Response
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production"
}
```

### GET /health/detailed

Detailed system health check.

#### Response
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-15T10:30:00Z",
    "status": "healthy",
    "overallScore": 95,
    "checks": {
      "database": {
        "name": "Database Connection",
        "status": "passed",
        "responseTime": 45,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "supabase_auth": {
        "name": "Supabase Authentication",
        "status": "passed",
        "responseTime": 30,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "api_performance": {
        "name": "API Performance",
        "status": "warning",
        "responseTime": 1200,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "memory_usage": {
        "name": "Memory Usage",
        "status": "healthy",
        "details": {
          "heapUsed": 85,
          "heapTotal": 120,
          "heapPercentage": 70.83
        },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    },
    "summary": {
      "total": 4,
      "passed": 3,
      "failed": 0,
      "warnings": 1,
      "critical": 0
    },
    "responseTime": 156,
    "system": {
      "uptime": 86400,
      "nodeVersion": "v16.14.0",
      "platform": "linux",
      "arch": "x64",
      "pid": 1234,
      "environment": "production"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_TOKEN` | Invalid or expired JWT token | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `VALIDATION_ERROR` | Request data validation failed | 422 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `DUPLICATE_RESOURCE` | Resource already exists | 409 |
| `INTERNAL_ERROR` | Internal server error | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SERVICE_UNAVAILABLE` | External service unavailable | 503 |

### Error Response Example
```json
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "details": {
    "token_type": "Bearer",
    "message": "Token has expired"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated Users**: 1000 requests per hour
- **Public Endpoints**: 100 requests per hour
- **Admin Endpoints**: 2000 requests per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642243200
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

class StockMarketAPI {
  constructor(baseURL, token) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getPortfolios() {
    const response = await this.client.get('/portfolios');
    return response.data;
  }

  async createPortfolio(portfolioData) {
    const response = await this.client.post('/portfolios', portfolioData);
    return response.data;
  }

  async getStockGuidance(symbol) {
    const response = await this.client.get(`/guidance/stock/${symbol}`);
    return response.data;
  }

  async submitFeedback(feedbackData) {
    const response = await this.client.post('/guidance/feedback', feedbackData);
    return response.data;
  }
}

// Usage example
const api = new StockMarketAPI('http://localhost:5000/api', 'your-jwt-token');

async function main() {
  try {
    const portfolios = await api.getPortfolios();
    console.log('Portfolios:', portfolios);
  } catch (error) {
    console.error('API Error:', error.response.data);
  }
}
```

### Python

```python
import requests
import json

class StockMarketAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_portfolios(self):
        response = requests.get(f'{self.base_url}/portfolios', headers=self.headers)
        return response.json()
    
    def create_portfolio(self, portfolio_data):
        response = requests.post(
            f'{self.base_url}/portfolios',
            headers=self.headers,
            json=portfolio_data
        )
        return response.json()
    
    def get_stock_guidance(self, symbol):
        response = requests.get(f'{self.base_url}/guidance/stock/{symbol}', headers=self.headers)
        return response.json()

# Usage example
api = StockMarketAPI('http://localhost:5000/api', 'your-jwt-token')

try:
    portfolios = api.get_portfolios()
    print('Portfolios:', json.dumps(portfolios, indent=2))
except requests.exceptions.RequestException as e:
    print(f'API Error: {e}')
```

### cURL Examples

#### Authentication
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token for authenticated requests
TOKEN="your-jwt-token"
```

#### Portfolio Management
```bash
# Get portfolios
curl -X GET http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer $TOKEN"

# Create portfolio
curl -X POST http://localhost:5000/api/portfolios \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Portfolio",
    "description": "Growth portfolio",
    "initial_capital": 10000
  }'
```

#### AI Guidance
```bash
# Get portfolio guidance
curl -X GET http://localhost:5000/api/guidance/portfolio \
  -H "Authorization: Bearer $TOKEN"

# Get stock analysis
curl -X GET http://localhost:5000/api/guidance/stock/AAPL \
  -H "Authorization: Bearer $TOKEN"
```

---

## Webhooks

The system supports webhooks for real-time notifications:

### Available Events
- `portfolio.updated` - Portfolio changes
- `stock.price_changed` - Price updates
- `order.executed` - Trade executions
- `alert.triggered` - Price alerts

### Webhook Configuration
```json
{
  "url": "https://your-app.com/webhooks/stock-market",
  "events": ["portfolio.updated", "stock.price_changed"],
  "secret": "your-webhook-secret"
}
```

### Webhook Payload Example
```json
{
  "event": "portfolio.updated",
  "data": {
    "portfolio_id": "portfolio-123",
    "previous_value": 45000.00,
    "new_value": 50000.00,
    "change_percent": 11.11
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "signature": "sha256=abc123..."
}
```

---

## Testing

### Postman Collection
A complete Postman collection is available with all endpoints for testing:
- Import the collection into Postman
- Set up environment variables
- Use pre-request scripts for authentication
- Includes test cases for all endpoints

### API Testing with Jest
```javascript
const request = require('supertest');
const { app } = require('../src/app');

describe('Portfolio API', () => {
  test('GET /portfolios should return user portfolios', async () => {
    const response = await request(app)
      .get('/api/portfolios')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.portfolios).toBeDefined();
  });
});
```

---

## Support and Contact

- **API Support**: api-support@stockmarket-ai.com
- **Documentation**: https://docs.stockmarket-ai.com
- **Status Page**: https://status.stockmarket-ai.com
- **Community Forum**: https://community.stockmarket-ai.com

For technical issues or questions about the API, please contact our support team or refer to the comprehensive documentation above.