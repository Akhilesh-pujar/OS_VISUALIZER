import mongoose from 'mongoose';
import { dbStatus, memoryCollections } from '../config/db.js';

const bannedClientSchema = new mongoose.Schema({
  identifierType: { type: String, enum: ['ip', 'userId', 'apiKey'], default: 'userId' },
  identifierValue: { type: String, required: true },
  reason: { type: String, default: 'Excessive 429 Violations / DDoS Pattern' },
  violationCount: { type: Number, default: 1 },
  bannedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

let MongooseBanModel;
try {
  MongooseBanModel = mongoose.model('BannedClient', bannedClientSchema);
} catch {
  MongooseBanModel = mongoose.model('BannedClient');
}

export const BannedClient = {
  create: async (data) => {
    if (dbStatus.mode === 'mongodb') return await MongooseBanModel.create(data);
    return await memoryCollections.BannedClient.create(data);
  },
  find: (query = {}) => {
    if (dbStatus.mode === 'mongodb') return MongooseBanModel.find(query);
    return memoryCollections.BannedClient.find(query);
  },
  findOne: async (query = {}) => {
    if (dbStatus.mode === 'mongodb') return await MongooseBanModel.findOne(query);
    return await memoryCollections.BannedClient.findOne(query);
  },
  deleteOne: async (filter) => {
    if (dbStatus.mode === 'mongodb') return await MongooseBanModel.deleteOne(filter);
    return await memoryCollections.BannedClient.deleteOne(filter);
  },
  deleteMany: async (filter = {}) => {
    if (dbStatus.mode === 'mongodb') return await MongooseBanModel.deleteMany(filter);
    return await memoryCollections.BannedClient.deleteMany(filter);
  }
};
