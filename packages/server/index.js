const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');

const logger = require('./services/logger');
const routes = require('./routes');

require('dotenv').config();
require('./services/jobs').run();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const { baseUrl, hostname, ip, method, originalUrl } = req;
  const log = {
    baseUrl,
    hostname,
    ip,
    method,
    status: res.statusCode,
    timestamp: new Date(),
    url: originalUrl,
    userAgent: req.headers['user-agent'],
  };
  logger.info('Request Logging', log);
  next();
});

app.use(helmet.contentSecurityPolicy({
  useDefaults: true,
  directives: {
    defaultSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", 'data:', 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
    imgSrc: ["'self'", 'data:', 'https://a.tile.openstreetmap.org', 'https://b.tile.openstreetmap.org', 'https://c.tile.openstreetmap.org', 'https://cdnjs.cloudflare.com'],
    mediaSrc: ["'self'", 'data:'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
    scriptSrc: ["'self'", 'https://storage.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net', 'https://code.jquery.com', 'https://unpkg.com'],
    upgradeInsecureRequests: null,
  },
}));

app.use('/', express.static(path.join(__dirname, '../web/dist')));
app.use('/api', routes);

const port = process.env.PORT || 8000;
app.listen(process.env.PORT || 8000, () => {
  console.info(`Listening on ${port}`);
});
