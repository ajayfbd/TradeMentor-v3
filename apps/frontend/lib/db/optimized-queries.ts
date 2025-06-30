import { db } from './db';
import { emotionEntries, tradeEntries } from './schema';
import { and, eq, gte, lte, desc, asc, sql, count } from 'drizzle-orm';
import { startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';

// Cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCachedQuery<T>(key: string, queryFn: () => Promise<T>, ttlMs = 5 * 60 * 1000): Promise<T> {
  const cached = queryCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < cached.ttl) {
    return Promise.resolve(cached.data);
  }
  
  return queryFn().then(data => {
    queryCache.set(key, { data, timestamp: now, ttl: ttlMs });
    return data;
  });
}

// Optimized emotion queries with proper indexing
export const emotionQueries = {
  // Get recent emotion entries with limit for performance
  getRecentEntries: (userId: string, limit = 10) => 
    getCachedQuery(
      `recent-emotions-${userId}-${limit}`,
      () => db
        .select()
        .from(emotionEntries)
        .where(eq(emotionEntries.userId, userId))
        .orderBy(desc(emotionEntries.createdAt))
        .limit(limit)
    ),

  // Get emotion trend with optimized date range queries
  getEmotionTrend: (userId: string, days = 30) => 
    getCachedQuery(
      `emotion-trend-${userId}-${days}`,
      () => {
        const startDate = subDays(new Date(), days);
        return db
          .select({
            date: sql<string>`DATE(${emotionEntries.createdAt})`,
            avgLevel: sql<number>`AVG(${emotionEntries.level})`,
            count: count(emotionEntries.id)
          })
          .from(emotionEntries)
          .where(
            and(
              eq(emotionEntries.userId, userId),
              gte(emotionEntries.createdAt, startDate)
            )
          )
          .groupBy(sql`DATE(${emotionEntries.createdAt})`)
          .orderBy(asc(sql`DATE(${emotionEntries.createdAt})`));
      },
      10 * 60 * 1000 // 10 minute cache for trends
    ),

  // Get emotion statistics with single optimized query
  getEmotionStats: (userId: string, period: 'week' | 'month' | 'quarter' = 'month') => 
    getCachedQuery(
      `emotion-stats-${userId}-${period}`,
      () => {
        const startDate = period === 'week' 
          ? subWeeks(new Date(), 1)
          : period === 'month'
          ? subMonths(new Date(), 1)
          : subMonths(new Date(), 3);

        return db
          .select({
            avgLevel: sql<number>`AVG(${emotionEntries.level})`,
            minLevel: sql<number>`MIN(${emotionEntries.level})`,
            maxLevel: sql<number>`MAX(${emotionEntries.level})`,
            totalEntries: count(emotionEntries.id),
            mostCommonContext: sql<string>`
              (SELECT context 
               FROM ${emotionEntries} e2 
               WHERE e2.user_id = ${emotionEntries.userId} 
                 AND e2.created_at >= ${startDate}
               GROUP BY context 
               ORDER BY COUNT(*) DESC 
               LIMIT 1)
            `
          })
          .from(emotionEntries)
          .where(
            and(
              eq(emotionEntries.userId, userId),
              gte(emotionEntries.createdAt, startDate)
            )
          );
      },
      15 * 60 * 1000 // 15 minute cache for stats
    ),

  // Get streak count with optimized consecutive day calculation
  getStreakCount: (userId: string) => 
    getCachedQuery(
      `streak-${userId}`,
      async () => {
        // Get unique dates with emotion entries, ordered by date desc
        const dailyEntries = await db
          .select({
            date: sql<string>`DATE(${emotionEntries.createdAt})`
          })
          .from(emotionEntries)
          .where(eq(emotionEntries.userId, userId))
          .groupBy(sql`DATE(${emotionEntries.createdAt})`)
          .orderBy(desc(sql`DATE(${emotionEntries.createdAt})`))
          .limit(365); // Only check last year for performance

        if (dailyEntries.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        const yesterday = subDays(today, 1);
        
        // Check if there's an entry today or yesterday
        const latestDate = new Date(dailyEntries[0].date);
        if (
          latestDate.toDateString() !== today.toDateString() && 
          latestDate.toDateString() !== yesterday.toDateString()
        ) {
          return 0;
        }

        // Calculate consecutive days
        let expectedDate = latestDate;
        for (const entry of dailyEntries) {
          const entryDate = new Date(entry.date);
          if (entryDate.toDateString() === expectedDate.toDateString()) {
            streak++;
            expectedDate = subDays(expectedDate, 1);
          } else {
            break;
          }
        }

        return streak;
      },
      2 * 60 * 1000 // 2 minute cache for streaks
    ),
};

// Optimized trade queries
export const tradeQueries = {
  // Get recent trades with essential fields only
  getRecentTrades: (userId: string, limit = 20) => 
    getCachedQuery(
      `recent-trades-${userId}-${limit}`,
      () => db
        .select({
          id: tradeEntries.id,
          symbol: tradeEntries.symbol,
          action: tradeEntries.action,
          outcome: tradeEntries.outcome,
          emotionBefore: tradeEntries.emotionBefore,
          emotionAfter: tradeEntries.emotionAfter,
          createdAt: tradeEntries.createdAt
        })
        .from(tradeEntries)
        .where(eq(tradeEntries.userId, userId))
        .orderBy(desc(tradeEntries.createdAt))
        .limit(limit)
    ),

  // Get trade performance with aggregated data
  getTradePerformance: (userId: string, days = 30) => 
    getCachedQuery(
      `trade-performance-${userId}-${days}`,
      () => {
        const startDate = subDays(new Date(), days);
        return db
          .select({
            totalTrades: count(tradeEntries.id),
            winRate: sql<number>`
              CAST(SUM(CASE WHEN ${tradeEntries.outcome} = 'win' THEN 1 ELSE 0 END) AS FLOAT) / 
              NULLIF(COUNT(*), 0) * 100
            `,
            avgEmotionBefore: sql<number>`AVG(${tradeEntries.emotionBefore})`,
            avgEmotionAfter: sql<number>`AVG(${tradeEntries.emotionAfter})`,
            mostTradedSymbol: sql<string>`
              (SELECT symbol 
               FROM ${tradeEntries} t2 
               WHERE t2.user_id = ${tradeEntries.userId} 
                 AND t2.created_at >= ${startDate}
               GROUP BY symbol 
               ORDER BY COUNT(*) DESC 
               LIMIT 1)
            `
          })
          .from(tradeEntries)
          .where(
            and(
              eq(tradeEntries.userId, userId),
              gte(tradeEntries.createdAt, startDate)
            )
          );
      },
      10 * 60 * 1000 // 10 minute cache
    ),
};

// Batch operations for better performance
export const batchOperations = {
  // Insert multiple emotion entries efficiently
  insertEmotionEntries: (entries: Array<typeof emotionEntries.$inferInsert>) => 
    db.insert(emotionEntries).values(entries),

  // Insert multiple trade entries efficiently
  insertTradeEntries: (entries: Array<typeof tradeEntries.$inferInsert>) => 
    db.insert(tradeEntries).values(entries),

  // Clear old cache entries periodically
  clearOldCache: () => {
    const now = Date.now();
    for (const [key, cached] of queryCache.entries()) {
      if ((now - cached.timestamp) > cached.ttl) {
        queryCache.delete(key);
      }
    }
  }
};

// Background cache warming for critical queries
export const warmCache = (userId: string) => {
  // Warm up most frequently accessed data
  emotionQueries.getRecentEntries(userId, 10);
  emotionQueries.getStreakCount(userId);
  tradeQueries.getRecentTrades(userId, 10);
  
  // Clear old cache entries
  batchOperations.clearOldCache();
};

// Utility to clear user-specific cache on updates
export const invalidateUserCache = (userId: string) => {
  for (const key of queryCache.keys()) {
    if (key.includes(userId)) {
      queryCache.delete(key);
    }
  }
};
