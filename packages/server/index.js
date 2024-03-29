const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const logger = require("./logger");

logger.init(true);

const routes = require("./routes");

require("dotenv").config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "https://cdn.plyr.io/3.7.8/plyr.svg"],
      fontSrc: [
        "'self'",
        "data:",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https://a.tile.openstreetmap.org",
        "https://b.tile.openstreetmap.org",
        "https://c.tile.openstreetmap.org",
        "https://cdnjs.cloudflare.com",
      ],
      mediaSrc: ["'self'", "data:"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
        "https://cdn.plyr.io/3.7.8/plyr.css"
      ],
      scriptSrc: [
        "'self'",
        "https://storage.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://code.jquery.com",
        "https://unpkg.com",
      ],
      upgradeInsecureRequests: null,
    },
  })
);
app.set("trust proxy", "127.0.0.1");

const morganMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  {
    stream: {
      write: (message) => logger.http(message),
    },
  }
);
app.use(morganMiddleware);

// Certain browsers require this header to be set for video files in order to support seeking.
app.use((req, res, next) => {
  res.setHeader('Accept-Ranges', 'bytes');
  next();
});

app.use((err, req, res, next) => {
  logger.error(err);
  res.sendStatus(500);
  next();
});

app.use("/", express.static(path.join(__dirname, "../web/dist")));
app.use("/api", routes);

const port = process.env.PORT || 8000;
app.listen(process.env.PORT || 8000, () => {
  console.info(`Listening on ${port}`);
});
