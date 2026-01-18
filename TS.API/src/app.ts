import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './generated/routes';
import { ValidateError } from 'tsoa';
import { config } from './config/env';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
}));
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
