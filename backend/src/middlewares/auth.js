const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token malformatado.' });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    return next();
  });
};