/**
 * Tests for config utilities
 */

// Mock mongodb
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(),
}));

import { Config } from '@/lib/config';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getMongoDBName', () => {
    it('should return prod database name in production', () => {
      process.env.ENV = 'production';
      process.env.MONGODB_DB_PROD = 'rhacbot_prod';
      // Need to reload the module to pick up new env
      jest.resetModules();
      const { Config: ProdConfig } = require('@/lib/config');
      expect(ProdConfig.getMongoDBName()).toBe('rhacbot_prod');
    });

    it('should return dev database name in development', () => {
      process.env.ENV = 'development';
      process.env.MONGODB_DB_DEV = 'rhacbot_dev';
      jest.resetModules();
      const { Config: DevConfig } = require('@/lib/config');
      expect(DevConfig.getMongoDBName()).toBe('rhacbot_dev');
    });

    it('should fallback to MONGODB_DB by default', () => {
      delete process.env.ENV;
      process.env.MONGODB_DB = 'rhacbot_default';
      delete process.env.MONGODB_DB_DEV;
      delete process.env.MONGODB_DB_PROD;
      jest.resetModules();
      const { Config: DefaultConfig } = require('@/lib/config');
      expect(DefaultConfig.getMongoDBName()).toBe('rhacbot_default');
    });
  });

  describe('environment variables', () => {
    it('should load ADMIN_PASSWORD from env', () => {
      expect(Config.ADMIN_PASSWORD).toBeDefined();
    });

    it('should load GROUPME_ACCESS_TOKEN from env', () => {
      expect(Config.GROUPME_ACCESS_TOKEN).toBeDefined();
    });

    it('should load MONGODB_URI from env', () => {
      expect(Config.MONGODB_URI).toBeDefined();
    });

    it('should load ENV from env', () => {
      expect(Config.ENV).toBeDefined();
    });
  });
});
