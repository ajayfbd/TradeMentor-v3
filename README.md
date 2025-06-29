# TradeMentor v3 - Emotion Trading Journal

A comprehensive mobile-first Progressive Web Application (PWA) for day traders to track their emotions and analyze trading performance patterns.

## 🎯 Overview

TradeMentor helps traders understand the correlation between their emotional state and trading performance through:

- **Emotion Tracking**: 1-10 scale with color-coded slider
- **Trade Logging**: Detailed trade entry with P&L tracking  
- **Pattern Analysis**: Emotion-performance correlation insights
- **Streak Counting**: Daily emotion check streaks for motivation
- **PWA Features**: Offline functionality, installable app, push notifications

## 📱 Core Features

### 5 Main Screens
1. **Emotion Check** - Log current emotional state (1-10) with context
2. **Trade Entry** - Record trades with symbol, P&L, and emotional context
3. **Patterns Dashboard** - Analyze emotion-performance correlations
4. **Profile** - User settings and streak tracking
5. **Authentication** - Secure login/register system

### Mobile-First Design
- Touch-optimized 44px minimum touch targets
- Bottom tab navigation for thumb accessibility
- PWA installable with native app feel
- Offline functionality with background sync

## 🏗️ Architecture

### Monorepo Structure
```
TradeMentor-v3/
├── apps/
│   ├── frontend/     # Next.js 14 PWA
│   └── api/          # .NET 8 Web API
├── packages/         # Shared utilities
└── docs/            # Documentation
```

### Tech Stack

#### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn UI** components
- **TanStack Query** for server state
- **Zustand** for client state
- **Next-PWA** for offline features

#### Backend
- **.NET 8 Web API**
- **Entity Framework Core** with PostgreSQL
- **JWT Authentication** with BCrypt
- **Swagger** API documentation
- **Background pattern analysis**

#### Database
- **PostgreSQL** with Entity Framework migrations
- **User management** with timezone support
- **Emotion checks** with context and notes
- **Trade records** with P&L and emotion linking
- **Proper relationships** and constraints

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- .NET 8 SDK
- PostgreSQL 13+

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd TradeMentor-v3
   npm install
   ```

2. **Setup database**
   ```bash
   # Update connection string in apps/api/appsettings.json
   cd apps/api
   dotnet ef database update
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Frontend
   cd apps/frontend
   npm run dev

   # Terminal 2 - API
   cd apps/api  
   dotnet run
   ```

4. **Access the app**
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/swagger

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

#### API (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=tradementor;Username=postgres;Password=password"
  },
  "Jwt": {
    "Secret": "your-super-secret-key-change-this-in-production"
  }
}
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Emotions  
- `GET /api/emotions` - Get user's emotion history
- `POST /api/emotions` - Log new emotion check
- `PUT /api/emotions/{id}` - Update emotion check
- `DELETE /api/emotions/{id}` - Delete emotion check

### Trades
- `GET /api/trades` - Get user's trade history  
- `POST /api/trades` - Create new trade
- `PUT /api/trades/{id}` - Update trade
- `DELETE /api/trades/{id}` - Delete trade

### Patterns
- `GET /api/patterns/analysis` - Complete pattern analysis
- `GET /api/patterns/emotion-patterns` - Emotion statistics
- `GET /api/patterns/performance-correlation` - Emotion-P&L correlation
- `GET /api/patterns/weekly-trends` - Weekly trend data
- `GET /api/patterns/insights` - AI-generated insights

## 🔧 Development

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### API Commands
```bash
dotnet run           # Start development server
dotnet build         # Build project
dotnet test          # Run tests
dotnet ef migrations add <name>  # Create migration
```

## 🏗️ Implementation Progress

### ✅ Completed (Days 1-2)
- [x] Monorepo structure with TurboRepo
- [x] Next.js 14 frontend with App Router
- [x] .NET 8 Web API with Entity Framework
- [x] PostgreSQL database schema
- [x] JWT authentication system
- [x] Core UI components (EmotionSlider, BottomTabNav)
- [x] All 5 main app screens
- [x] Complete API controllers (Auth, Emotions, Trades, Patterns)
- [x] Pattern analysis service with insights
- [x] PWA configuration and service worker
- [x] Offline functionality with background sync

### 🔄 Next Steps (Days 3-4)
- [ ] Pattern visualization with Recharts
- [ ] Push notification system
- [ ] Advanced offline storage with IndexedDB
- [ ] Performance optimization
- [ ] Comprehensive testing

### 🎯 Future Enhancements (Days 5-10)
- [ ] Advanced analytics dashboard
- [ ] Export functionality (CSV/PDF)
- [ ] Social features and sharing
- [ ] Advanced streak gamification
- [ ] Custom emotion scales
- [ ] Integration with trading platforms

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#4338CA) 
- **Emotion Low**: Red (#DC2626)
- **Emotion Mid**: Amber (#F59E0B)
- **Emotion High**: Emerald (#059669)
- **Background**: Slate-50 (#F8FAFC)

### Typography
- **Font**: Inter (Google Fonts)
- **Headings**: Font weights 600-700
- **Body**: Font weight 400
- **Mobile-optimized**: 16px minimum for readability

## 📱 PWA Features

### Service Worker Capabilities
- **Offline page caching** for core app functionality
- **API response caching** with network-first strategy
- **Background sync** for failed requests
- **Push notifications** for streak reminders
- **Install prompts** for native app experience

### Caching Strategy
- **Static files**: Cache-first with service worker updates
- **API calls**: Network-first with cache fallback
- **Offline storage**: IndexedDB for failed requests

## 🔒 Security

### Authentication
- **JWT tokens** with 7-day expiration
- **BCrypt password hashing** with salt rounds
- **Secure HTTP-only cookie** option available
- **User session isolation** with proper authorization

### Data Privacy
- **User data isolation** - users only see their own data
- **Secure API endpoints** with JWT validation
- **Input validation** and sanitization
- **SQL injection protection** with Entity Framework

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** team for the excellent framework
- **.NET** team for the robust backend platform
- **Tailwind CSS** for the utility-first styling approach
- **Shadcn** for the beautiful component library
- **TanStack** for excellent data fetching tools
