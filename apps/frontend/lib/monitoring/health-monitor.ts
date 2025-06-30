import { NextRequest, NextResponse } from 'next/server';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: {
    memory: {
      used: number;
      free: number;
      total: number;
    };
    cpu?: number;
    activeConnections?: number;
  };
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private healthChecks: Map<string, () => Promise<HealthCheck>> = new Map();
  private lastHealthCheck: SystemHealth | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.registerDefaultChecks();
    this.startHealthCheckInterval();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private registerDefaultChecks(): void {
    // Database health check
    this.registerCheck('database', async () => {
      const startTime = Date.now();
      try {
        // Mock database check - replace with actual database ping
        await this.checkDatabase();
        return {
          service: 'database',
          status: 'healthy' as const,
          responseTime: Date.now() - startTime,
          details: { connection: 'active' },
        };
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Database connection failed',
        };
      }
    });

    // Memory health check
    this.registerCheck('memory', async () => {
      const startTime = Date.now();
      try {
        const memoryUsage = process.memoryUsage();
        const freeMemory = memoryUsage.heapTotal - memoryUsage.heapUsed;
        const memoryUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

        const status = memoryUtilization > 90 ? 'unhealthy' 
                    : memoryUtilization > 75 ? 'degraded' 
                    : 'healthy';

        return {
          service: 'memory',
          status,
          responseTime: Date.now() - startTime,
          details: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            utilization: `${memoryUtilization.toFixed(2)}%`,
          },
        };
      } catch (error) {
        return {
          service: 'memory',
          status: 'unhealthy' as const,
          responseTime: Date.now() - startTime,
          error: 'Failed to check memory usage',
        };
      }
    });

    // External API health check (if applicable)
    this.registerCheck('external_apis', async () => {
      const startTime = Date.now();
      try {
        // Check critical external APIs
        await this.checkExternalAPIs();
        return {
          service: 'external_apis',
          status: 'healthy' as const,
          responseTime: Date.now() - startTime,
          details: { apis: 'responsive' },
        };
      } catch (error) {
        return {
          service: 'external_apis',
          status: 'degraded' as const,
          responseTime: Date.now() - startTime,
          error: 'Some external APIs are unresponsive',
        };
      }
    });
  }

  registerCheck(name: string, checkFunction: () => Promise<HealthCheck>): void {
    this.healthChecks.set(name, checkFunction);
  }

  private async checkDatabase(): Promise<void> {
    // Mock database check - implement actual database ping
    // Example with a simple query timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 5000);
    });

    const dbCheckPromise = new Promise(resolve => {
      // Simulate database check
      setTimeout(resolve, 100);
    });

    await Promise.race([dbCheckPromise, timeoutPromise]);
  }

  private async checkExternalAPIs(): Promise<void> {
    // Check critical external services
    const checks: Promise<any>[] = [
      // Add your external API checks here
      // fetch('https://api.example.com/health', { timeout: 5000 })
    ];

    if (checks.length > 0) {
      await Promise.all(checks);
    }
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // Run all health checks in parallel
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([name, checkFn]) => {
        try {
          return await checkFn();
        } catch (error) {
          return {
            service: name,
            status: 'unhealthy' as const,
            responseTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Health check failed',
          };
        }
      }
    );

    checks.push(...await Promise.all(checkPromises));

    // Determine overall status
    const hasUnhealthy = checks.some(check => check.status === 'unhealthy');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    
    const overallStatus = hasUnhealthy ? 'unhealthy' 
                        : hasDegraded ? 'degraded' 
                        : 'healthy';

    // Get system metrics
    const memoryUsage = process.memoryUsage();

    const health: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics: {
        memory: {
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
        },
      },
    };

    this.lastHealthCheck = health;
    return health;
  }

  getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }

  private startHealthCheckInterval(): void {
    // Perform health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Health check endpoint handler
export async function GET(request: NextRequest) {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const health = await healthMonitor.performHealthCheck();

    // Return appropriate HTTP status based on health
    const statusCode = health.status === 'healthy' ? 200
                     : health.status === 'degraded' ? 200  // Still operational
                     : 503; // Service unavailable

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Readiness check (for orchestrators like Kubernetes)
export async function readinessCheck(): Promise<boolean> {
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const health = await healthMonitor.performHealthCheck();
    return health.status !== 'unhealthy';
  } catch {
    return false;
  }
}

// Liveness check (basic application responsiveness)
export async function livenessCheck(): Promise<boolean> {
  try {
    // Basic check that the application is responsive
    return process.uptime() > 0;
  } catch {
    return false;
  }
}

export const healthMonitor = HealthMonitor.getInstance();
