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
    if (!req.query.hasOwnProperty(p)) {
      missingParam(res, p);
      return;
    }
  }

  next();
};

const requiredBody = (properties) => (req, res, next) => {
  for (const p of properties) {
    if (!req.body.hasOwnProperty(p)) {
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
