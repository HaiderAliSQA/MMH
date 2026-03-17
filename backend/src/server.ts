import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import connectDB from './config/db';
import routes from './routes';

dotenv.config();

const app = express();

// Handle ALL preflight requests — SABSE PEHLE
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.sendStatus(200);
});

// CORS — sab allow karo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check — responds immediately, used by keep-alive ping
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    message: '🏥 MMH Server is running',
    hospital: 'Majida Memorial Hospital, Chiniot',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + ' seconds',
  });
});

// Also add /api/health as backup
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// All routes
app.use('/api', routes);

// Global error handler
app.use((
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🏥 MMH Server running on port ${PORT}`);
    console.log(`🌐 CORS: All origins allowed`);
  });
};

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});