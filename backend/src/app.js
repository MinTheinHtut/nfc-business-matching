import cors from 'cors';
import express from 'express';
import session from 'express-session';
import { sessionCookieName, sessionCookieOptions } from './config/session-cookie.js';
import { sessionStore } from './config/session-store.js';
import adminCompanyRouter from './routes/admin-company.routes.js';
import adminNfcRouter from './routes/admin-nfc.routes.js';
import authRouter from './routes/auth.routes.js';
import databaseRouter from './routes/database.routes.js';
import healthRouter from './routes/health.routes.js';
import publicCompanyRouter from './routes/public-company.routes.js';
import contactRouter from './routes/contact.routes.js';
import adminDashboardRouter from './routes/admin-dashboard.routes.js';
import adminExhibitorRouter from './routes/admin-exhibitor.routes.js';
import adminConfirmationRouter from './routes/admin-confirmation.routes.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

app.disable('x-powered-by');

// Hosting providers normally terminate HTTPS before forwarding to Express.
// Trusting the first proxy lets express-session recognize the original secure request.
if (isProduction) app.set('trust proxy', 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin.replace(/\/$/, '') === frontendUrl) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    name: sessionCookieName,
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    // Netlify and the hosted API use different sites, so production cookies
    // must explicitly opt in to cross-site credentialed requests over HTTPS.
    cookie: sessionCookieOptions,
  }),
);

app.use('/api', healthRouter);
app.use('/api', databaseRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/companies', adminCompanyRouter);
app.use('/api/admin/nfc-tags', adminNfcRouter);
app.use('/api/public/companies', publicCompanyRouter);
app.use('/api/contacts', contactRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/exhibitors', adminExhibitorRouter);
app.use('/api/admin/confirmations', adminConfirmationRouter);

app.use((request, response) => {
  response.status(404).json({ message: 'Route not found' });
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ message: 'Internal server error' });
});

export default app;
