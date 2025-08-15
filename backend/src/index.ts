import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { instagramConfig } from './config/instagram';
import messagesRouter from './routes/messages';
import instagramWebhookRouter from './routes/instagramWebhook';
import instagramAuthRouter from './routes/instagramAuth';

dotenv.config();

const app = express();

// Middleware - Sets CSP configuration
app.use((req, res, next) => {
  if (req.path.startsWith('/auth/instagram') || req.path.startsWith('/api/auth/instagram')) {
    // Disable CSP for Instagram OAuth routes
    next();
  } else {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https:"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    })(req, res, next);
  }
});

app.use(cors({
  // for deployment purposes/cors between frontend/backend
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL || 'https://default-domain.com']
    : ['http://localhost:3000', 'https://localhost:3000', 'http://127.0.0.1:3000', 'https://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (returns env vars)
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      instagram: {
        hasVerifyToken: !!instagramConfig.verifyToken,
        webhookUrl: instagramConfig.webhookUrl,
        apiUrl: instagramConfig.apiUrl
      }
    }
  });
});

// API routes
app.use('/api/messages', messagesRouter);
app.use('/api/auth/instagram', instagramAuthRouter); // Redirect to Instagram OAuth
app.use('/auth/instagram', instagramAuthRouter); // Callback route(redirect uri) after Instagram successfully authenticates
app.use('/webhook/instagram', instagramWebhookRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Configure Port Number
const PORT = parseInt(process.env.PORT || '3001', 10);

// Start HTTPS server (required for Instagram OAuth)
try {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../../certs/localhost-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../certs/localhost-cert.pem'))
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔒 HTTPS Server running on port ${PORT}`);
    console.log(`🔧 Health check: https://localhost:${PORT}/health`);
    console.log(`📸 Instagram OAuth: https://localhost:${PORT}/api/auth/instagram`);
    console.log(`📸 Instagram Webhook: ${instagramConfig.webhookUrl}`);

    if (!instagramConfig.validateConfig()) {
      console.warn('⚠️  Warning: Instagram configuration is incomplete. Please check your .env file.');
    } else {
      console.log('✅ Instagram configuration is valid');
    }
  });
} catch (error) {
  console.warn('⚠️  Warning: Could not start HTTPS server. SSL certificates may be missing.');
  console.warn('   Instagram OAuth will not work without HTTPS.');
  console.warn('   Falling back to HTTP server (OAuth will not work)...');
  console.error('   Error:', error);

  // Fallback to HTTP server if SSL certificates are missing
  app.listen(PORT, () => {
    console.log(`🚀 HTTP Server running on port ${PORT} (FALLBACK - OAuth disabled)`);
    console.log(`🔧 Health check: http://localhost:${PORT}/health`);
    console.warn('⚠️  Instagram OAuth requires HTTPS - please add SSL certificates');
  });
}

export default app;
