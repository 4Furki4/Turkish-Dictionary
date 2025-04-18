#!/usr/bin/env node
// CommonJS wrapper to run the TS seed script under Node via ts-node
require('ts-node').register({
  transpileOnly: true,
});
// Load environment variables
require('dotenv/config');
// Invoke the TypeScript seeder
require('./seed-tdk.ts');
