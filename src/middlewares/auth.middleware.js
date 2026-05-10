const { verifyAccessToken } = require('../utils/token');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId: '...' }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden, invalid token' });
  }
};

module.exports = { protect };
