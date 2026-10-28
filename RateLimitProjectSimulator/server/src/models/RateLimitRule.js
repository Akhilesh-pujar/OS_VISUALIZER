import mongoose from 'mongoose';
import { dbStatus, memoryCollections } from '../config/db.js';

const rateLimitRuleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  endpointPattern: { type: String, default: '*' },
  clientTier: { type: String, default: 'ALL' },
  algorithm: { 
    type: String, 
    enum: ['sliding-window-log', 'sliding-window-counter', 'token-bucket', 'fixed-window'],
    default: 'sliding-window-log'
  },
  limit: { type: Number, default: 5 }, // e.g. 5 requests
  windowSeconds: { type: Number, default: 60 }, // per 60 seconds (1 minute)
  bucketCapacity: { type: Number, default: 5 },
  refillRate: { type: Number, default: 0.083 }, // tokens per second
  burstTolerance: { type: Number, default: 5 },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

let MongooseRuleModel;
try {
  MongooseRuleModel = mongoose.model('RateLimitRule', rateLimitRuleSchema);
} catch {
  MongooseRuleModel = mongoose.model('RateLimitRule');
}

export const defaultRules = [
  {
    ruleId: 'global-default',
    name: 'Global Standard (User Minute Quota)',
    endpointPattern: '*',
    clientTier: 'ALL',
    algorithm: 'sliding-window-log',
    limit: 5,
    windowSeconds: 60,
    bucketCapacity: 5,
    refillRate: 5 / 60,
    burstTolerance: 5,
    enabled: true
  },
  {
    ruleId: 'auth-strict',
    name: 'Strict Auth / Login Protection',
    endpointPattern: '/api/v1/auth/login',
    clientTier: 'ALL',
    algorithm: 'sliding-window-log',
    limit: 3,
    windowSeconds: 60,
    bucketCapacity: 3,
    refillRate: 3 / 60,
    burstTolerance: 3,
    enabled: true
  },
  {
    ruleId: 'search-burst',
    name: 'Search Endpoint (Token Bucket Burst)',
    endpointPattern: '/api/v1/search',
    clientTier: 'ALL',
    algorithm: 'token-bucket',
    limit: 10,
    windowSeconds: 60,
    bucketCapacity: 8,
    refillRate: 0.5,
    burstTolerance: 8,
    enabled: true
  },
  {
    ruleId: 'heavy-compute-quota',
    name: 'Heavy Compute / Resource Intensive',
    endpointPattern: '/api/v1/heavy-compute',
    clientTier: 'ALL',
    algorithm: 'sliding-window-counter',
    limit: 2,
    windowSeconds: 60,
    bucketCapacity: 2,
    refillRate: 2 / 60,
    burstTolerance: 2,
    enabled: true
  }
];

export const RateLimitRule = {
  create: async (data) => {
    if (dbStatus.mode === 'mongodb') return await MongooseRuleModel.create(data);
    return await memoryCollections.RateLimitRule.create(data);
  },
  find: (query = {}) => {
    if (dbStatus.mode === 'mongodb') return MongooseRuleModel.find(query);
    return memoryCollections.RateLimitRule.find(query);
  },
  findOne: async (query = {}) => {
    if (dbStatus.mode === 'mongodb') return await MongooseRuleModel.findOne(query);
    return await memoryCollections.RateLimitRule.findOne(query);
  },
  findOneAndUpdate: async (filter, update, options) => {
    if (dbStatus.mode === 'mongodb') return await MongooseRuleModel.findOneAndUpdate(filter, update, options);
    return await memoryCollections.RateLimitRule.findOneAndUpdate(filter, update, options);
  },
  deleteOne: async (filter) => {
    if (dbStatus.mode === 'mongodb') return await MongooseRuleModel.deleteOne(filter);
    return await memoryCollections.RateLimitRule.deleteOne(filter);
  },
  deleteMany: async (filter = {}) => {
    if (dbStatus.mode === 'mongodb') return await MongooseRuleModel.deleteMany(filter);
    return await memoryCollections.RateLimitRule.deleteMany(filter);
  },
  initDefaults: async () => {
    const count = await (dbStatus.mode === 'mongodb' ? MongooseRuleModel.countDocuments() : memoryCollections.RateLimitRule.countDocuments());
    if (count === 0) {
      for (const rule of defaultRules) {
        if (dbStatus.mode === 'mongodb') {
          await MongooseRuleModel.create(rule);
        } else {
          await memoryCollections.RateLimitRule.create(rule);
        }
      }
    }
  }
};
