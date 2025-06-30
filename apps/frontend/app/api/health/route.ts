import { healthMonitor } from '@/lib/monitoring/health-monitor';

export const dynamic = 'force-dynamic';

export async function GET() {
  return healthMonitor.performHealthCheck();
}
