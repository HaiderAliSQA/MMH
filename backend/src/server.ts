import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import connectDB from './config/db';

import routes from './routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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
