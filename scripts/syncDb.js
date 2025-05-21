const db = require('../models');

db.sequelize.sync({ alter: true }) // alter:true akan menyesuaikan struktur tabel tanpa menghapus data
  .then(() => {
    console.log("✅ Database dan tabel berhasil disinkronisasi.");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Gagal sinkronisasi database:", err);
    process.exit(1);
  });
