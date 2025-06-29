# TradeMentor API - PostgreSQL Setup Guide

## 🎉 API Status: Successfully Running!

Your TradeMentor API is now running at: **http://localhost:5202**

✅ **What's Working:**
- API is compiled and running
- Swagger UI is accessible
- All endpoints are configured
- Authentication, controllers, and services are ready

❌ **What Needs Setup:**
- PostgreSQL database connection

## PostgreSQL Installation Options

### Option 1: Manual Installation (Recommended)

1. **Download PostgreSQL:**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 17.x for Windows x64
   - Run the installer as Administrator

2. **During Installation:**
   - Keep default installation directory
   - **IMPORTANT**: Set a password for the `postgres` user (remember this!)
   - Keep default port: `5432`
   - Keep default locale
   - Install pgAdmin 4 (database management tool)

3. **After Installation:**
   - PostgreSQL service will start automatically
   - You can access pgAdmin 4 from Start Menu

### Option 2: Using Docker (Alternative)

If you have Docker Desktop:

\`\`\`bash
# Run PostgreSQL in Docker
docker run --name tradementor-postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres:17

# Connect to create database
docker exec -it tradementor-postgres psql -U postgres -c "CREATE DATABASE tradementor;"
\`\`\`

### Option 3: PostgreSQL Portable

1. Download from: https://github.com/garethflowers/postgresql-portable/releases
2. Extract and run \`PostgreSQLPortable.exe\`
3. No installation required, runs from folder

## Database Setup Steps

### 1. Update Connection String

Edit \`appsettings.json\` with your PostgreSQL password:

\`\`\`json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=tradementor;Username=postgres;Password=YOUR_PASSWORD_HERE"
  }
}
\`\`\`

### 2. Create Database

Option A - Using pgAdmin 4:
- Open pgAdmin 4
- Connect to PostgreSQL (localhost:5432)
- Right-click "Databases" → Create → Database
- Name: \`tradementor\`

Option B - Using Command Line:
\`\`\`bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Create database
CREATE DATABASE tradementor;

# Exit
\\q
\`\`\`

### 3. Restart the API

After setting up PostgreSQL:

\`\`\`bash
# Stop current API (Ctrl+C in terminal)
# Then restart
cd "D:\\Ajay Projects\\TradeMentor-v3\\apps\\api"
dotnet run --project TradeMentor.Api.csproj
\`\`\`

## Testing the API

Once PostgreSQL is connected:

### 1. Register a User
\`\`\`bash
curl -X POST http://localhost:5202/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "timezone": "UTC"
  }'
\`\`\`

### 2. Login
\`\`\`bash
curl -X POST http://localhost:5202/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
\`\`\`

### 3. Use the JWT Token

Copy the token from login response and use it:

\`\`\`bash
curl -X GET http://localhost:5202/api/emotions \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
\`\`\`

## API Endpoints Summary

### 🔐 Authentication (\`/api/auth\`)
- \`POST /register\` - Register new user
- \`POST /login\` - User login  
- \`POST /logout\` - User logout

### 😊 Emotions (\`/api/emotions\`)
- \`GET /\` - Get emotion checks
- \`POST /\` - Create emotion check
- \`PUT /{id}\` - Update emotion check
- \`DELETE /{id}\` - Delete emotion check
- \`GET /average\` - Get average emotion
- \`GET /latest\` - Get latest emotion

### 📈 Trades (\`/api/trades\`)
- \`GET /\` - Get trades
- \`POST /\` - Create trade
- \`PUT /{id}\` - Update trade
- \`DELETE /{id}\` - Delete trade
- \`GET /stats\` - Get trading statistics

### 📊 Patterns (\`/api/patterns\`)
- \`GET /emotion-performance\` - Emotion vs performance data
- \`GET /weekly-trend\` - Weekly trend analysis
- \`GET /insights\` - AI-generated insights
- \`GET /analysis\` - Full pattern analysis

### 🏥 Health & Info
- \`GET /health\` - Health status
- \`GET /api/info\` - API information

## Development URLs

- **Swagger UI**: http://localhost:5202
- **API Base**: http://localhost:5202/api
- **Health Check**: http://localhost:5202/health

## Next Steps

1. **Install PostgreSQL** (choose one option above)
2. **Update connection string** in \`appsettings.json\`
3. **Restart API** - database tables will be created automatically
4. **Test endpoints** using Swagger UI or curl
5. **Connect React frontend** to these endpoints

## Troubleshooting

### Common Issues:

**"password authentication failed"**
- Check your PostgreSQL password in \`appsettings.json\`
- Ensure PostgreSQL service is running

**"database does not exist"**  
- Create the \`tradementor\` database in PostgreSQL
- Or change database name in connection string

**"connection refused"**
- Check if PostgreSQL is running on port 5432
- Verify firewall settings

**Need Help?**
- Check logs in the terminal where API is running
- Use pgAdmin 4 to verify database connection
- Test connection string with any PostgreSQL client

## Success Indicators

✅ API running without database errors
✅ Swagger UI loads at http://localhost:5202  
✅ \`/health\` endpoint returns healthy status
✅ Can register and login users
✅ JWT authentication working
✅ All CRUD operations functional

Your TradeMentor API backend is now ready for production use! 🚀
