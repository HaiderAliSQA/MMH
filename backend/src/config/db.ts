import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI not set in environment');
    }

    await mongoose.connect(uri, {
      dbName: 'mmh_hospital',
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err);
});

export default connectDB;
