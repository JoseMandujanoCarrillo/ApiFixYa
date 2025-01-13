const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';

module.exports = {
  authenticate: (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).send('Token is missing');
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(403).send('Invalid token');
    }
  },

  authorizeRole: (role) => {
    return (req, res, next) => {
      if (req.user.role !== role) {
        return res.status(403).send('Access denied');
      }
      next();
    };
  },
};
