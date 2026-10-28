import mongoose from 'mongoose';

// High-fidelity fallback in-memory document store if standalone MongoDB is not running
class MemoryCollection {
  constructor(name) {
    this.name = name;
    this.data = [];
  }

  async create(doc) {
    const item = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...doc
    };
    this.data.unshift(item); // latest first
    // Cap in-memory history to last 2000 items to keep memory clean
    if (this.data.length > 2000) {
      this.data.pop();
    }
    return item;
  }

  find(filter = {}) {
    let result = [...this.data];
    if (filter && Object.keys(filter).length > 0) {
      result = result.filter(item => {
        for (const [key, val] of Object.entries(filter)) {
          if (val && typeof val === 'object' && val.$regex) {
            const regex = new RegExp(val.$regex, val.$options || 'i');
            if (!regex.test(item[key])) return false;
          } else if (item[key] !== val) {
            return false;
          }
        }
        return true;
      });
    }

    const queryObj = {
      _result: result,
      sort(sortObj = {}) {
        const [field, dir] = Object.entries(sortObj)[0] || ['timestamp', -1];
        this._result.sort((a, b) => {
          const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
          const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
          return dir === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
        return this;
      },
      limit(n) {
        this._result = this._result.slice(0, n);
        return this;
      },
      skip(s) {
        this._result = this._result.slice(s);
        return this;
      },
      async exec() {
        return this._result;
      },
      then(resolve, reject) {
        return Promise.resolve(this._result).then(resolve, reject);
      }
    };

    return queryObj;
  }

  async findOne(filter = {}) {
    for (const item of this.data) {
      let match = true;
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) return item;
    }
    return null;
  }

  async findById(id) {
    return this.data.find(item => item._id === id || item.id === id) || null;
  }

  async findOneAndUpdate(filter, update, options = {}) {
    let item = await this.findOne(filter);
    if (!item && options.upsert) {
      item = await this.create({ ...filter, ...(update.$set || update) });
      return item;
    }
    if (item) {
      const updates = update.$set || update;
      Object.assign(item, updates, { updatedAt: new Date() });
    }
    return item;
  }

  async updateOne(filter, update) {
    const item = await this.findOne(filter);
    if (item) {
      const updates = update.$set || update;
      Object.assign(item, updates, { updatedAt: new Date() });
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(filter) {
    const idx = this.data.findIndex(item => {
      for (const [k, v] of Object.entries(filter)) {
        if (item[k] !== v) return false;
      }
      return true;
    });
    if (idx !== -1) {
      this.data.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(filter = {}) {
    const origLen = this.data.length;
    if (Object.keys(filter).length === 0) {
      this.data = [];
      return { deletedCount: origLen };
    }
    this.data = this.data.filter(item => {
      for (const [k, v] of Object.entries(filter)) {
        if (item[k] === v) return false;
      }
      return true;
    });
    return { deletedCount: origLen - this.data.length };
  }

  async countDocuments(filter = {}) {
    if (Object.keys(filter).length === 0) return this.data.length;
    let count = 0;
    for (const item of this.data) {
      let match = true;
      for (const [k, v] of Object.entries(filter)) {
        if (item[k] !== v) {
          match = false;
          break;
        }
      }
      if (match) count++;
    }
    return count;
  }
}

export const memoryCollections = {
  RequestLog: new MemoryCollection('RequestLog'),
  RateLimitRule: new MemoryCollection('RateLimitRule'),
  BannedClient: new MemoryCollection('BannedClient')
};

export let dbStatus = {
  connected: false,
  mode: 'in-memory-mongo',
  host: 'local-memory',
  uri: 'in-memory://ratelimit-store'
};

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratelimit_simulator';
  
  try {
    // Attempt local MongoDB connection with 2 second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000
    });
    dbStatus = {
      connected: true,
      mode: 'mongodb',
      host: mongoose.connection.host,
      uri: mongoUri
    };
    console.log(`[MongoDB] Connected successfully to ${mongoose.connection.host}`);
  } catch (err) {
    dbStatus = {
      connected: true,
      mode: 'in-memory-mongo',
      host: 'local-memory',
      uri: 'in-memory://ratelimit-store'
    };
    console.log(`[MongoDB Info] Standalone MongoDB daemon not detected (${err.message}).`);
    console.log(`[MongoDB Mode] Activated High-Speed Resilient In-Memory Mongo Store for seamless operation!`);
  }
};
