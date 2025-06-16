const { Journal, Project, User } = require("../models");
const sendEmail = require("../utils/sendEmail");

exports.createJournal = async (req, res) => {
  try {
    const { isi } = req.body;
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: "User",
          attributes: ["nama"],
        },
      ],
    });

    if (!project || project.user_id !== req.user.userId) {
      return res
        .status(403)
        .json({ message: "Tidak berhak mengirim jurnal ke project ini" });
    }

    const journal = await Journal.create({
      isi,
      project_id: projectId,
    });

    // Kirim notifikasi email ke admin
    const santriName = project.User.nama;
    const projectName = project.judul;

    await sendEmail(
      process.env.EMAIL_ADMIN,
      "📘 Jurnal Baru Dikirim",
      `Si "${santriName}" mengirim jurnal baru untuk project "${projectName}":\n\n"${isi}"`
    );

    req.app.get("io").emit("journal_update");
    res.status(201).json({ message: "Jurnal berhasil dikirim", journal });
  } catch (error) {
    console.error("Gagal kirim jurnal:", error);
    res.status(500).json({ message: "Gagal kirim jurnal", error });
  }
};

exports.getJournalsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    // Ambil project beserta user-nya
    const project = await Project.findByPk(projectId, {
      include: {
        model: require("../models").User,
        attributes: ["nama", "role"],
      },
    });

    if (
      !project ||
      (project.user_id !== req.user.userId && req.user.role !== "admin")
    ) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    const journals = await Journal.findAll({
      where: { project_id: projectId },
      order: [["created_at", "DESC"]],
    });

    res.json({
      projectTitle: project.judul,
      userName: project.User ? project.User.nama : null, // tambahkan nama user
      userRole: project.User ? project.User.role : null, // tambahkan role user
      journals,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal ambil jurnal", error });
  }
};

exports.updateJournal = async (req, res) => {
  try {
    const { journalId } = req.params;
    const { isi, status } = req.body;

    // Cari jurnal
    const journal = await Journal.findByPk(journalId, {
      include: { model: Project },
    });
    if (!journal)
      return res.status(404).json({ message: "Jurnal tidak ditemukan" });

    // Hanya pemilik project atau admin yang boleh edit
    if (
      journal.Project.user_id !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    // Update jurnal
    journal.isi = isi ?? journal.isi;
    journal.status = status ?? journal.status;
    await journal.save();

    req.app.get("io").emit("journal_update");

    res.json({ message: "Jurnal berhasil diupdate", journal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
    res.status(500).json({ message: "Gagal update jurnal", error });
  }
};

exports.deleteJournal = async (req, res) => {
  try {
    const { journalId } = req.params;

    // Cari jurnal
    const journal = await Journal.findByPk(journalId, {
      include: { model: Project },
    });
    if (!journal)
      return res.status(404).json({ message: "Jurnal tidak ditemukan" });

    // Hanya pemilik project atau admin yang boleh hapus
    if (
      journal.Project.user_id !== req.user.userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Akses ditolak" });
    }

    await journal.destroy();
    req.app.get("io").emit("journal_update");
    res.json({ message: "Jurnal berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal hapus jurnal", error });
  }
};

// controller/projectController.js
exports.markJournalsAsRead = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project)
      return res.status(404).json({ message: "Project tidak ditemukan" });

    // Hanya admin atau pemilik yang boleh
    if (req.user.role !== "admin" && req.user.userId !== project.user_id) {
      return res
        .status(403)
        .json({ message: "Tidak diizinkan mengakses jurnal ini" });
    }

    // Update semua jurnal "belum_dibaca" menjadi "sudah_dibaca"
    await Journal.update(
      { status: "sudah_dibaca" },
      {
        where: {
          project_id: projectId,
          status: "belum_dibaca",
        },
      }
    );

    // Emit event ke semua client
    req.app.get("io").emit("journal_read");

    res.json({ message: "Jurnal berhasil ditandai sebagai sudah dibaca" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menandai jurnal", error: err });
  }
};
