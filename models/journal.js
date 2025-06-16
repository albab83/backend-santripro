// models/journal.js
module.exports = (sequelize, DataTypes) => {
  const Journal = sequelize.define(
    "Journal",
    {
      tanggal: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "belum_dibaca",
      },
    },
    {
      tableName: "journals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  Journal.associate = (models) => {
    Journal.belongsTo(models.Project, { foreignKey: "project_id" });
  };

  return Journal;
};
