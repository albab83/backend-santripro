require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false // set ke true kalau mau lihat log query
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import semua model
db.User = require('./user')(sequelize, DataTypes);
db.Project = require('./project')(sequelize, DataTypes);
db.Journal = require('./journal')(sequelize, DataTypes);

// Relasi antar model
db.User.hasMany(db.Project, { foreignKey: 'user_id' });
db.Project.belongsTo(db.User, { foreignKey: 'user_id' });

db.Project.hasMany(db.Journal, { foreignKey: 'project_id' });
db.Journal.belongsTo(db.Project, { foreignKey: 'project_id' });

module.exports = db;
                