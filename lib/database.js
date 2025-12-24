const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connected = false;
        this.connection = null;
    }

    async connect(uri) {
        try {
            if (this.connected) return this.connection;
            
            this.connection = await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            this.connected = true;
            console.log('╔► ✅ Database connected successfully');
            console.log(`╚► → URI: ${uri.split('@')[1]?.split('/')[0] || 'Local'}`);
            
            return this.connection;
        } catch (error) {
            console.error('╔► ❌ Database connection failed:');
            console.error(`╚► → ${error.message}`);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.connected && this.connection) {
                await mongoose.disconnect();
                this.connected = false;
                this.connection = null;
                console.log('╔► ℹ️ Database disconnected');
                console.log('╚► → Connection closed');
            }
        } catch (error) {
            console.error('╔► ❌ Database disconnection error:');
            console.error(`╚► → ${error.message}`);
        }
    }

    async checkConnection() {
        try {
            await mongoose.connection.db.admin().ping();
            return { status: 'connected', ping: 'ok' };
        } catch (error) {
            return { status: 'disconnected', error: error.message };
        }
    }

    async backupDatabase() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const backupData = {};
            
            for (const collection of collections) {
                const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
                backupData[collection.name] = data;
            }
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = `./data/backup_${timestamp}.json`;
            
            require('fs').writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
            
            return {
                success: true,
                path: backupPath,
                collections: collections.length,
                timestamp: new Date().toLocaleString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getStats() {
        try {
            const collections = await mongoose.connection.db.listCollections().toArray();
            const stats = {
                totalCollections: collections.length,
                collections: []
            };
            
            for (const collection of collections) {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                const size = await mongoose.connection.db.collection(collection.name).stats();
                
                stats.collections.push({
                    name: collection.name,
                    count: count,
                    size: size.size || 0,
                    avgObjSize: size.avgObjSize || 0,
                    storageSize: size.storageSize || 0
                });
            }
            
            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new Database();