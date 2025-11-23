import { config } from 'dotenv';
import { z } from 'zod';

import { globalLogger } from '@~/lib/logger';

switch (process.env.NODE_ENV) {
  case 'test': {
    config({ path: '.env.test' });
    globalLogger.info('Loaded .env.test file');
    break;
  }
  case 'production': {
    // we assume they are passed to by container
    // e.g. Heroku, Docker, etc.
    globalLogger.info('Current environment expects variables to by passed by container');
    break;
  }
  case undefined:
  case 'development':
    globalLogger.info('Using .development.env file');
    config();
    globalLogger.info('Loaded .development.env file');
    break;
  default:
    throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}.`);
}

const envSchema = z.object({
  // AUTH CONFIG
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url(),

  // DB CONFIG
  MONGO_URI: z.url().optional().default('mongodb://localhost:6060/shurai'),
  MONGO_USER: z.string().optional().default('username'),
  MONGO_PASSWORD: z.string().optional().default('password'),
  MONGO_DATABASE_NAME: z.string().optional().default('shurai'),

  // SERVER CONFIG
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).optional().default(5050),
  SERVER_HOST: z.string().optional().default('localhost'),
  CORS_ORIGIN: z.url().optional().default(''),

  // POPULATION CONFIG
  POPULATE_ON_EMPTY: z.enum(['ASSETS', 'FULL', 'NONE']).optional().default('NONE'),
});

const env = envSchema.safeParse(process.env);
if (!env.success) {
  globalLogger.error('Environment variables validation failure', {
    errors: z.treeifyError(env.error),
  });
  throw new Error('Invalid environment variables');
}

export default env.data;
