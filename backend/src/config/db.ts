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

  } catch (error: any) {
    if (error.code === 'ENOTFOUND') {
      console.error('\n❌ DNS RESOLUTION ERROR: Could not find MongoDB Atlas host.');
      console.error('👉 TROUBLESHOOTING:');
      console.error('   1. Check your internet connection.');
      console.error('   2. Try changing your DNS (e.g. to Google 8.8.8.8 or Cloudflare 1.1.1.1).');
      console.error('   3. Ensure your IP address is whitelisted in MongoDB Atlas.\n');
    } else {
      console.error('❌ MongoDB connection failed:', error.message || error);
    }
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
