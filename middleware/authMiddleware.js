const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Ambil token dari header

  if (!token) {
    return res.status(403).json({ message: 'Token diperlukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }
    req.user = decoded; // Simpan informasi user ke request
    next();
  });
};

exports.verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Akses hanya untuk admin' });
  }
  next();
};
