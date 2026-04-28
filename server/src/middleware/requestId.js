const { randomUUID } = require("crypto");

module.exports = (req, res, next) => {
  const incoming = req.get("X-Request-Id");
  req.id = incoming && /^[\w-]{8,128}$/.test(incoming) ? incoming : randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
};
