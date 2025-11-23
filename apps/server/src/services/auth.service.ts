import type { mongoose } from '@typegoose/typegoose';
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { username } from 'better-auth/plugins';

import { UserProfileModel } from '@~/db/models/user-profile.model';
import { devImpersonatePlugin } from '@~/lib/auth-plugins/dev-impersonate.plugin';
import { createLogger } from '@~/lib/logger';

const logger = createLogger('auth');

const createInstance = (db: mongoose.mongo.Db) =>
  betterAuth({
    database: mongodbAdapter(db),
    trustedOrigins: [process.env.CORS_ORIGIN ?? ''],
    plugins: [username(), devImpersonatePlugin()],
    emailAndPassword: {
      enabled: true,
    },
    telemetry: {
      enabled: false,
    },
    basePath: '/auth',
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
        httpOnly: true,
      },
    },
    databaseHooks: {
      user: {
        create: {
          async after(user) {
            try {
              await UserProfileModel.create({ userId: user.id });
            } catch (e) {
              logger.error('User profile creation failed', {
                userId: user.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          },
        },
      },
    },
  });

class AuthService {
  private instance: ReturnType<typeof createInstance> | null = null;

  public connect(db: mongoose.mongo.Db) {
    this.instance = createInstance(db);
  }

  public getInstance() {
    if (!this.instance) throw new Error('AuthService not initialized. Call connect() first.');

    return this.instance;
  }
}

export default new AuthService();
