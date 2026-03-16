import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import connectDB from './config/db';
import routes from './routes';

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mmh-frontend.vercel.app',
  'https://mmh-frontend-qojj0oefb-haider-alis-projects-9f8f6426.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow Postman and server-to-server (no origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow any vercel.app subdomain for MMH
    if (origin.includes('mmh-frontend') && 
        origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    console.log('CORS blocked:', origin);
    return callback(new Error('CORS not allowed'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
}));

// Handle ALL preflight requests
app.options('*', cors());

// This must come AFTER cors middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // wait for DB first
  
  app.listen(PORT, () => {
    console.log(`🏥 MMH Server running on port ${PORT}`);
  });
};

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
