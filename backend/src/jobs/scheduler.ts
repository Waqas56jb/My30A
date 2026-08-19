import { query } from '../config/db.js';
import { logger } from '../config/logger.js';
import { syncEventsFeed } from '../services/eventsFeedService.js';
import { checkRestaurantBookingFreshness } from '../services/restaurantBookingService.js';

async function runJob(name: string, fn: () => Promise<void>) {
  const started = new Date();
  try {
    await fn();
    await query(
      `insert into job_runs (job_name, status, started_at, finished_at) values ($1,'ok',$2, now())`,
      [name, started.toISOString()],
    );
  } catch (error) {
    logger.error({ err: error, name }, 'job failed');
    await query(
      `insert into job_runs (job_name, status, detail, started_at, finished_at) values ($1,'failed',$2,$3, now())`,
      [name, JSON.stringify({ message: String((error as Error).message) }), started.toISOString()],
    );
  }
}

export function startJobs() {
  const hour = 60 * 60 * 1000;
  void runJob('events_feed_sync', async () => {
    await syncEventsFeed();
  });
  setInterval(() => {
    void runJob('events_feed_sync', async () => {
      await syncEventsFeed();
    });
  }, hour);
  setInterval(() => {
    void runJob('partner_analytics_noop', async () => {
      await query(`select 1`);
    });
  }, hour);

  setInterval(() => {
    void runJob('token_expiry_sweep', async () => {
      await query(`update guest_access_tokens set revoked_at = now() where expires_at < now() and revoked_at is null`);
    });
  }, hour);

  const week = 7 * 24 * hour;
  void runJob('restaurant_booking_freshness', async () => {
    const result = await checkRestaurantBookingFreshness();
    logger.info({ staleCount: result.staleCount }, 'Restaurant booking freshness check');
  });
  setInterval(() => {
    void runJob('restaurant_booking_freshness', async () => {
      const result = await checkRestaurantBookingFreshness();
      logger.info({ staleCount: result.staleCount }, 'Restaurant booking freshness check');
    });
  }, week);
}
