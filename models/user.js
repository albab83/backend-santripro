// models/user.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    nama: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('santri', 'admin'),
      allowNull: false,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  });

  User.beforeCreate(async (user) => {
    if (user.password) {
      const bcrypt = require('bcryptjs');
      user.password = await bcrypt.hash(user.password, 10);
    }
  });

  User.associate = (models) => {
    User.hasMany(models.Project, { foreignKey: 'user_id' });
  };

  return User;
};
