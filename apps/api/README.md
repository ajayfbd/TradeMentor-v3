# TradeMentor API

A comprehensive .NET 8 Web API for trading psychology and emotion tracking.

## Overview

TradeMentor API provides a robust backend for tracking trading emotions, managing trade data, and analyzing performance patterns. Built with .NET 8, Entity Framework Core, PostgreSQL, and JWT authentication.

## Features

- **User Authentication**: JWT-based authentication with Microsoft Identity
- **Emotion Tracking**: Record and track emotional states before/after trades
- **Trade Management**: Comprehensive trade logging with P&L tracking
- **Pattern Analysis**: AI-powered insights into emotion-performance correlations
- **RESTful API**: Clean, well-documented REST endpoints
- **Swagger Documentation**: Interactive API documentation
- **Health Checks**: Monitor application health and database connectivity

## Project Structure

```
/apps/api/
├── Controllers/           # API Controllers
│   ├── AuthController.cs     # Authentication endpoints
│   ├── EmotionController.cs  # Emotion tracking endpoints
│   ├── TradeController.cs    # Trade management endpoints
│   └── PatternController.cs  # Analytics endpoints
├── Models/               # Data Models and DTOs
│   ├── User.cs              # User entity with Identity
│   ├── EmotionCheck.cs      # Emotion tracking entity
│   ├── Trade.cs             # Trading data entity
│   └── ApiResponse.cs       # Response models and DTOs
├── Data/                 # Data Access Layer
│   ├── ApplicationDbContext.cs  # EF Core DbContext
│   └── Repositories/            # Repository pattern
├── Services/             # Business Logic
│   ├── AuthService.cs       # Authentication service
│   └── PatternService.cs    # Analytics service
├── Program.cs            # Application startup
└── TradeMentor.Api.csproj  # Project file
```

## Prerequisites

- .NET 8 SDK
- PostgreSQL 12+ 
- Visual Studio 2022 or VS Code

## Dependencies

- **Microsoft.EntityFrameworkCore.PostgreSQL** (8.0.6) - PostgreSQL provider
- **Microsoft.AspNetCore.Identity** (8.0.6) - User authentication
- **Microsoft.AspNetCore.Authentication.JwtBearer** (8.0.6) - JWT authentication
- **Swashbuckle.AspNetCore** (6.4.0) - Swagger/OpenAPI documentation
- **BCrypt.Net-Next** (4.0.3) - Password hashing

## Configuration

### Database Connection

Update `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=tradementor;Username=postgres;Password=yourpassword"
  },
  "Jwt": {
    "Secret": "your-secret-key-minimum-32-characters-long"
  }
}
```

### Environment Variables

For production, use environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret

## Getting Started

### 1. Clone and Setup

```bash
cd D:\Ajay Projects\TradeMentor-v3\apps\api
dotnet restore
```

### 2. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE tradementor;
```

The application will automatically create tables on first run (development mode).

### 3. Run the Application

```bash
dotnet run
```

The API will be available at:
- **Swagger UI**: https://localhost:5001 (or http://localhost:5000)
- **Health Check**: https://localhost:5001/health
- **API Info**: https://localhost:5001/api/info

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /check-email` - Check email availability

### Emotions (`/api/emotions`)
- `GET /` - Get user's emotion checks (with filtering)
- `GET /{id}` - Get specific emotion check
- `POST /` - Create emotion check
- `PUT /{id}` - Update emotion check
- `DELETE /{id}` - Delete emotion check
- `GET /average` - Get average emotion level
- `GET /latest` - Get latest emotion check

### Trades (`/api/trades`)
- `GET /` - Get user's trades (with filtering)
- `GET /{id}` - Get specific trade
- `POST /` - Create trade
- `PUT /{id}` - Update trade
- `DELETE /{id}` - Delete trade
- `GET /stats` - Get trading statistics

### Patterns (`/api/patterns`)
- `GET /emotion-performance` - Emotion vs performance data
- `GET /weekly-trend` - Weekly trend analysis
- `GET /insights` - AI-generated insights
- `GET /analysis` - Comprehensive pattern analysis
- `GET /emotion-distribution` - Emotion level distribution
- `GET /performance-by-day` - Performance by day of week

## Authentication

The API uses JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Example Login Request

```bash
curl -X POST https://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

## Data Models

### User
- Identity-based user with streak tracking
- Timezone support for global users
- Audit fields (created/updated timestamps)

### EmotionCheck
- 1-10 scale emotion tracking
- Context: pre-trade, post-trade, market-event
- Optional trade symbol and notes
- User relationship and indexing

### Trade
- Comprehensive trade tracking
- Entry/exit prices, P&L calculation
- Trade type and outcome classification
- Optional emotion check correlation

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"],
  "data": null
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: BCrypt with salt
- **CORS Configuration**: Controlled cross-origin access
- **Security Headers**: XSS protection, content type sniffing prevention
- **Input Validation**: Model validation and sanitization

## Logging

The application includes comprehensive logging:
- Request/response logging
- Error tracking
- Performance monitoring
- User action auditing

## Health Monitoring

Health check endpoint (`/health`) monitors:
- Application status
- Database connectivity
- Service dependencies

## Development

### Adding New Features

1. **Models**: Add entities to `/Models`
2. **Controllers**: Create controllers in `/Controllers`
3. **Services**: Implement business logic in `/Services`
4. **Repositories**: Add data access in `/Data/Repositories`
5. **Register**: Add dependencies in `Program.cs`

### Testing

```bash
# Run tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## Production Deployment

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Configuration**: Use environment variables
3. **HTTPS**: Enable SSL certificates
4. **Logging**: Configure structured logging
5. **Monitoring**: Set up health checks and metrics

### Docker Support

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY bin/Release/net8.0/publish/ App/
WORKDIR /App
ENTRYPOINT ["dotnet", "TradeMentor.Api.dll"]
```

## API Versioning

The API supports versioning through:
- URL path: `/api/v1/controller`
- Query parameter: `?version=1.0`
- Header: `X-Version: 1.0`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- GitHub Issues: [TradeMentor Issues](https://github.com/tradementor/issues)
- Email: support@tradementor.app

## License

This project is licensed under the MIT License.
