// models/project.js
module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
    judul: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tujuan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('menunggu', 'diterima', 'ditolak', 'selesai'),
      defaultValue: 'menunggu',
    },
    tanggal_pengajuan: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    alasan_penolakan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'tanggal_pengajuan',
    updatedAt: 'updated_at',
  });

  Project.associate = (models) => {
    Project.belongsTo(models.User, { foreignKey: 'user_id' });
    Project.hasMany(models.Journal, { foreignKey: 'project_id' });
  };

  return Project;
};
