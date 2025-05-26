require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { sequelize } = require('./models');

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/project', require('./routes/project'));
app.use('/api/journal', require('./routes/journal'));


// Sync Database
sequelize.sync()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Error connecting to database:', err));

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
