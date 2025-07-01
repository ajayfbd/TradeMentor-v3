# Enhanced Database Schema Documentation

## Overview

This document outlines the comprehensive database schema enhancements implemented for TradeMentor v3. The enhancements focus on improved emotion tracking, user session management, AI-generated insights, and enhanced trading analytics.

## Database Schema Changes

### 1. Enhanced EmotionChecks Table

**New Fields Added:**
- `PrimaryEmotion` (VARCHAR(20)): Categorized emotion type
- `Intensity` (INTEGER): Emotion intensity scale 1-5
- `MarketConditions` (VARCHAR(100)): Market context when emotion was logged
- `SessionId` (UUID): Links emotion to user session

**Constraints:**
- Primary emotion must be one of: 'fear', 'greed', 'confidence', 'anxiety', 'excitement', 'frustration', 'calm', 'fomo'
- Intensity must be between 1 and 5

**Indexes:**
- `idx_emotion_checks_primary_emotion` on `PrimaryEmotion`
- Enhanced `idx_emotion_checks_user_timestamp` on `(UserId, Timestamp DESC)`

### 2. Enhanced Trades Table

**New Fields Added:**
- `SetupQuality` (INTEGER): Trade setup quality rating 1-5
- `ExecutionQuality` (INTEGER): Trade execution quality rating 1-5

**Constraints:**
- Both quality ratings must be between 1 and 5

**Indexes:**
- Enhanced existing indexes for better performance

### 3. New UserSessions Table

**Purpose:** Track daily user engagement and session quality

**Fields:**
- `Id` (UUID, Primary Key)
- `UserId` (UUID, Foreign Key to Users)
- `Date` (DATE): Session date
- `EmotionsLogged` (INTEGER): Number of emotions logged that day
- `TradesLogged` (INTEGER): Number of trades logged that day
- `SessionQualityScore` (DECIMAL(3,2)): Overall session quality (0-10)
- `CreatedAt` (TIMESTAMP)

**Constraints:**
- Unique constraint on `(UserId, Date)`
- Session quality score between 0.00 and 10.00

**Indexes:**
- `idx_user_sessions_user_date` on `(UserId, Date DESC)`
- `idx_user_sessions_date` on `Date`

### 4. New UserInsights Table

**Purpose:** Store AI-generated insights and recommendations

**Fields:**
- `Id` (UUID, Primary Key)
- `UserId` (UUID, Foreign Key to Users)
- `InsightType` (VARCHAR(50)): Type of insight
- `Title` (VARCHAR(200)): Insight title
- `Description` (TEXT): Detailed insight description
- `Data` (JSONB): Flexible insight metadata
- `ConfidenceScore` (DECIMAL(3,2)): Insight reliability (0-10)
- `GeneratedAt` (TIMESTAMP)
- `IsActive` (BOOLEAN): Whether insight is currently relevant

**Insight Types:**
- `performance_correlation`: Emotion-performance relationships
- `best_times`: Optimal trading time analysis
- `emotion_pattern`: Emotion frequency and pattern analysis
- `streak_milestone`: Consistency streak achievements

**Constraints:**
- Insight type must be one of the predefined values
- Confidence score between 0.00 and 10.00

**Indexes:**
- `idx_user_insights_user_type` on `(UserId, InsightType)`
- `idx_user_insights_active` on `IsActive`

## Entity Framework Models

### New Models Created:

1. **UserSession.cs**
   - Tracks daily user engagement
   - Links to User entity
   - Includes session quality scoring

2. **UserInsight.cs**
   - AI-generated insights storage
   - Flexible JSON data field
   - Confidence scoring system

3. **Enhanced EmotionCheck.cs**
   - Added primary emotion categorization
   - Emotion intensity tracking
   - Market conditions context

4. **Enhanced Trade.cs**
   - Setup and execution quality ratings
   - Better performance tracking

## Service Layer Implementation

### UserSessionService
- `GetSessionByDateAsync()`: Retrieve specific date session
- `GetSessionsForUserAsync()`: Get user sessions with date filtering
- `CreateOrUpdateSessionAsync()`: Create or update daily session
- `UpdateSessionQualityScoreAsync()`: Update session quality
- `GetSessionStreakAsync()`: Calculate current consistency streak
- `GetAverageSessionQualityAsync()`: Calculate average session quality

### UserInsightService
- `CreateInsightAsync()`: Create new insight
- `GetInsightsForUserAsync()`: Retrieve user insights with filtering
- `GetTopInsightsAsync()`: Get highest confidence insights
- `GeneratePerformanceCorrelationInsightAsync()`: Analyze emotion-performance correlation
- `GenerateBestTimesInsightAsync()`: Analyze optimal trading times
- `GenerateEmotionPatternInsightAsync()`: Analyze emotion patterns
- `GenerateStreakMilestoneInsightAsync()`: Track consistency milestones

## API Endpoints

### UserSessions Controller (`/api/usersessions`)
- `GET /` - Get user sessions with optional date filtering
- `GET /{date}` - Get session for specific date
- `POST /` - Create or update session
- `PUT /{sessionId}/quality-score` - Update session quality score
- `GET /streak` - Get current consistency streak
- `GET /average-quality` - Get average session quality

### UserInsights Controller (`/api/userinsights`)
- `GET /` - Get user insights with filtering
- `GET /{insightId}` - Get specific insight
- `GET /top` - Get top insights by confidence
- `POST /generate/performance-correlation` - Generate performance correlation insight
- `POST /generate/best-times` - Generate best times insight
- `POST /generate/emotion-patterns` - Generate emotion pattern insight
- `POST /generate/streak-milestone` - Generate streak milestone insight
- `POST /generate/all` - Generate all insight types
- `PUT /{insightId}` - Update insight
- `DELETE /{insightId}` - Delete insight

## Migration Strategy

### 1. Staging Environment Testing
```sql
-- Verify migration on staging first
dotnet ef database update --environment Staging
```

### 2. Data Validation
- Verify existing emotion_checks data integrity
- Ensure trades table enhancements don't affect existing data
- Test new table creation and relationships

### 3. Performance Testing
- Verify all indexes are working correctly
- Test query performance with enhanced schema
- Monitor for any performance degradation

### 4. Production Deployment
- Apply migration during low-traffic period
- Monitor application performance post-deployment
- Have rollback plan ready if issues arise

## Backwards Compatibility

### Maintained Compatibility:
- All existing API endpoints continue to function
- Existing data remains intact
- New fields are nullable to support existing records

### Enhanced Features:
- EmotionCheck model now supports richer emotion data
- Trade model includes quality assessments
- New session tracking provides engagement metrics
- AI insights provide personalized recommendations

## Benefits

### 1. Enhanced Analytics
- Deeper emotion tracking with categories and intensity
- Session-based engagement tracking
- Trade quality assessment

### 2. AI-Powered Insights
- Automated pattern recognition
- Personalized recommendations
- Performance correlation analysis

### 3. Improved User Experience
- Streak tracking for motivation
- Best times analysis for optimization
- Emotion pattern awareness

### 4. Better Data Quality
- Structured emotion categorization
- Session quality scoring
- Confidence-based insights

## Next Steps

1. **Frontend Integration**: Update React components to utilize new endpoints
2. **AI Enhancement**: Improve insight generation algorithms
3. **Mobile Optimization**: Ensure mobile apps support new features
4. **Performance Monitoring**: Track query performance and optimize as needed

## Security Considerations

- All new endpoints require authentication
- User data isolation maintained
- Input validation on all new fields
- SQL injection protection through Entity Framework

## Testing Strategy

### Unit Tests
- Service layer functionality
- Entity validation
- Business logic verification

### Integration Tests
- API endpoint testing
- Database operations
- Migration verification

### Performance Tests
- Query optimization
- Index effectiveness
- Bulk operation performance

This enhanced schema provides a solid foundation for advanced trading psychology analytics while maintaining backwards compatibility and ensuring optimal performance.
