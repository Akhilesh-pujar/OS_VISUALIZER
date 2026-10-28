import mongoose from 'mongoose';
import { dbStatus, memoryCollections } from '../config/db.js';

const requestLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  ip: { type: String, default: '127.0.0.1' },
  userId: { type: String, default: 'anonymous', index: true },
  apiKey: { type: String, default: 'none' },
  clientTier: { type: String, default: 'Free' },
  endpoint: { type: String, required: true },
  method: { type: String, default: 'GET' },
  statusCode: { type: Number, required: true },
  statusText: { type: String, default: 'OK' },
  algorithm: { type: String, default: 'sliding-window-log' },
  limit: { type: Number, default: 5 },
  remaining: { type: Number, default: 4 },
  resetTime: { type: Number },
  windowSeconds: { type: Number, default: 60 },
  latencyMs: { type: Number, default: 5 },
  abuseDetected: { type: Boolean, default: false },
  abuseType: { type: String, default: null },
  blockedReason: { type: String, default: null },
  headers: { type: Object, default: {} }
}, { timestamps: true });

let MongooseModel;
try {
  MongooseModel = mongoose.model('RequestLog', requestLogSchema);
} catch {
  MongooseModel = mongoose.model('RequestLog');
}

export const RequestLog = {
  create: async (data) => {
    if (dbStatus.mode === 'mongodb') {
      return await MongooseModel.create(data);
    }
    return await memoryCollections.RequestLog.create(data);
  },
  find: (query) => {
    if (dbStatus.mode === 'mongodb') {
      return MongooseModel.find(query);
    }
    return memoryCollections.RequestLog.find(query);
  },
  countDocuments: async (query = {}) => {
    if (dbStatus.mode === 'mongodb') {
      return await MongooseModel.countDocuments(query);
    }
    return await memoryCollections.RequestLog.countDocuments(query);
  },
  deleteMany: async (query = {}) => {
    if (dbStatus.mode === 'mongodb') {
      return await MongooseModel.deleteMany(query);
    }
    return await memoryCollections.RequestLog.deleteMany(query);
  }
};
