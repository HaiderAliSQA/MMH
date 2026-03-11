const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;
        
        try {
            // Attempt to connect to local/provided MongoDB with a short timeout
            const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
            console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
            return;
        } catch (localError) {
            console.log(`Local MongoDB not running (${localError.message}). Starting temporary In-Memory MongoDB for testing...`);
            
            // Fallback to in-memory server
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected (In-Memory Temp Server): ${conn.connection.host}`);
            
            // Seed a manager user for login, as DB is empty
            const User = require('../models/User');
            await User.create({ name: 'Admin Temp', role: 'admin', pass: '1234' }).catch(e=>e);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
