import { createLogger } from '@~/lib/logger';

import achievementsLoader from './achievements.loader';
import authLoader from './auth.loader';
import databaseLoader from './database.loader';
import honoLoader from './hono.loader';
import populationLoader from './population.loader';

const logger = createLogger('loaders');

export default async function loaders() {
  logger.info('Starting loaders...');

  logger.info('Loading database...');
  const db = await databaseLoader();
  logger.info('Database loaded.');

  logger.info('Loading authentication...');
  const instance = await authLoader(db);
  logger.info('Authentication loaded.');

  logger.info('Loading population...');
  await populationLoader();
  logger.info('Population loaded.');

  logger.info('Loading achievements...');
  await achievementsLoader();
  logger.info('Achievements loaded.');

  logger.info('Loading Hono framework...');
  const { app, appRouter } = await honoLoader(instance);
  logger.info('Hono framework loaded.');

  logger.info('All loaders completed.');

  return { app, auth: instance, appRouter };
}
