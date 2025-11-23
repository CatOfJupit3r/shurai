import mongoose from 'mongoose';

import env from '@~/constants/env';
import { createLogger } from '@~/lib/logger';

class DatabaseService {
  private logger = createLogger('database');

  public async connect() {
    if (process.env.NODE_ENV === 'test') return;
    await this.connectToExternalDatabase();
  }

  private async connectToExternalDatabase() {
    await mongoose
      .connect(env.MONGO_URI, {
        dbName: env.MONGO_DATABASE_NAME,
        auth: {
          username: env.MONGO_USER,
          password: env.MONGO_PASSWORD,
        },
      })
      .catch((error) => {
        this.logger.error('Error connecting to database', {
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }

  public getClient() {
    const client = mongoose.connection.getClient();
    if (!client) throw new Error('Database client is not connected');
    return client.db();
  }
}

export default new DatabaseService();
