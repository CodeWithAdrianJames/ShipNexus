import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CLIENT = 'DATABASE_CLIENT';

export const databaseProvider = {
  provide: DATABASE_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const url = configService.getOrThrow<string>('DATABASE_URL');
    const client = postgres(url);
    return drizzle(client, { schema });
  },
};
