const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser')

const logger = require('./logger');
logger.init(true);

const routes = require('./routes');

require('dotenv').config();
require('./services/jobs').run();

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const stream = {
  write: (message) => logger.info(message),
};
const morganMiddleware = morgan(
  // Define message format string (this is the default one).
  // The message format is made from tokens, and each token is
  // defined inside the Morgan library.
  // You can create your custom token to show what do you want from a request.
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  // Options: in this case, I overwrote the stream and the skip logic.
  // See the methods above.
  { stream },
);
app.use(morganMiddleware);

app.use('/', express.static(path.join(__dirname, '../web/dist')));
app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.sendStatus(500);
  next();
});

const port = process.env.PORT || 8000;
app.listen(process.env.PORT || 8000, () => {
  console.info(`Listening on ${port}`);
});
