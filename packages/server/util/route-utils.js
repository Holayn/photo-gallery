const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const missingParam = (res, parameterName) => {
  res.status(400).send(`Missing parameter: ${parameterName}`);
};
const missingProperty = (res, propertyName) => {
  res.status(400).send(`Missing property: ${propertyName}`);
};

const requiredParams = (params) => (req, res, next) => {
  for (const p of params) {
    if (!Object.hasOwn(req.query, p)) {
      missingParam(res, p);
      return;
    }
  }

  next();
};

const requiredBody = (properties) => (req, res, next) => {
  for (const p of properties) {
    // Express 5 leaves req.body undefined when no body parser matched the request.
    if (!req.body || !Object.hasOwn(req.body, p)) {
      missingProperty(res, p);
      return;
    }
  }

  next();
};

module.exports = {
  asyncHandler,
  missingParam,
  missingProperty,
  requiredParams,
  requiredBody,
};
