const { Project, User } = require("../models");

exports.createProject = async (req, res) => {
  try {
    const { judul, deskripsi, tujuan } = req.body;
    const user_id = req.user.userId;

    // Cek apakah user masih punya project yang statusnya belum 'selesai'
    const existing = await Project.findOne({
      where: {
        user_id,
        status: { [require("sequelize").Op.not]: "selesai" },
      },
    });
    if (existing) {
      return res.status(400).json({
        message:
          "Anda masih memiliki project yang belum selesai. Selesaikan dulu sebelum mengajukan project baru.",
      });
    }

    const project = await Project.create({ judul, deskripsi, tujuan, user_id });
    req.app.get("io").emit("project_update");
    res.status(201).json({ message: "Proposal berhasil dikirim", project });
  } catch (error) {
    res.status(500).json({ message: "Gagal membuat project", error });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: { model: User, attributes: ["nama", "email"] },
      order: [["tanggal_pengajuan", "DESC"]],
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data project" });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const user_id = req.user.userId;
    const projects = await Project.findAll({
      where: { user_id },
      order: [
        ["tanggal_pengajuan", "DESC"],
        ["id", "DESC"],
      ],
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil project milik sendiri" });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const id = req.params.id;
    await Project.update({ status: "diterima" }, { where: { id } });

    req.app.get("io").emit("project_update");

    res.json({ message: "Proposal disetujui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyetujui proposal" });
  }
};

exports.rejectProject = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    if (!reason)
      return res.status(400).json({ message: "Alasan penolakan wajib diisi" });

    await Project.update(
      { status: "ditolak", alasan_penolakan: reason },
      { where: { id } }
    );

    req.app.get("io").emit("project_update");

    res.json({ message: "Proposal ditolak" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menolak proposal" });
  }
};

exports.finishProject = async (req, res) => {
  try {
    const { id } = req.params;
    // Cari project
    const project = await Project.findByPk(id);
    if (!project)
      return res.status(404).json({ message: "Project tidak ditemukan" });

    // Update status menjadi 'selesai'
    project.status = "selesai";
    await project.save();

    req.app.get("io").emit("project_update");

    res.json({ message: "Project berhasil diselesaikan", project });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyelesaikan project", error });
  }
};
