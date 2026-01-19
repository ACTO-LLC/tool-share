import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './generated/routes';
import { ValidateError } from 'tsoa';
import { config } from './config/env';
import { handleStripeWebhook } from './routes/subscriptionsController';

// Configure multer for file uploads (memory storage for blob upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'));
    }
  },
});

// Export multer instance for TSOA
export { upload };

const app: Express = express();

// Stripe webhook route - MUST be registered before express.json() middleware
// because Stripe requires the raw body for signature verification
app.post(
  '/api/subscriptions/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));

// Stripe webhook needs raw body for signature verification
// Must be registered BEFORE express.json() middleware
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Swagger documentation
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const swaggerDocument = require('../swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  console.log('Swagger document not found. Run "yarn build" to generate.');
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register TSOA routes
RegisterRoutes(app);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidateError) {
    console.warn(`Validation Error: ${JSON.stringify(err.fields)}`);
    return res.status(422).json({
      message: 'Validation Failed',
      details: err.fields,
    });
  }

  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
    return res.status(500).json({
      message: 'Internal Server Error',
    });
  }

  return res.status(500).json({ message: 'Unknown Error' });
});

const port = config.PORT;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API docs available at http://localhost:${port}/api-docs`);
});

export default app;
