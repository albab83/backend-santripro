const { Project, User, Journal } = require("../models");
const { Op, fn, col, literal, json } = require("sequelize");

exports.createProject = async (req, res) => {
  try {
    const { judul, deskripsi, tujuan } = req.body;
    const user_id = req.user.userId;

    // Cek apakah user masih punya project yang statusnya belum 'selesai'
    const existing = await Project.findOne({
      where: {
        user_id,
        status: {
          [Op.in]: ["diterima", "menunggu", "proses"],
        },
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

exports.filterProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, nama, santri, status, tanggal } = req.query;

    const where = {};
    const userWhere = {};

    if (nama) where.judul = { [Op.iLike]: `%${nama}%` };
    if (status) where.status = status;
    if (tanggal) {
      where.tanggal_pengajuan = {
        [Op.gte]: tanggal + " 00:00:00",
        [Op.lte]: tanggal + " 23:59:59",
      };
    }
    if (santri) userWhere.nama = { [Op.iLike]: `%${santri}%` };

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["nama", "email"],
          where: userWhere,
        },
        {
          model: Journal,
          as: "Journals",
          required: false,
          where: { status: "belum_dibaca" },
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [fn("COUNT", col("Journals.id")), "jumlahJurnalBelumDibaca"],
          [fn("MAX", col("Journals.created_at")), "latestJournalDate"],
        ],
      },
      group: ["Project.id", "User.id"],
      order: [
        [literal('MAX("Journals"."created_at")'), "DESC NULLS LAST"],
        [literal('COUNT("Journals"."id")'), "DESC"],
        ["tanggal_pengajuan", "DESC"],
      ],

      limit: parseInt(limit),
      offset,
      subQuery: false,
    });

    const total = projects.length;

    const formatted = projects.map((project) => {
      const plain = project.get({ plain: true });
      plain.jumlahJurnalBelumDibaca =
        parseInt(plain.jumlahJurnalBelumDibaca) || 0;
      return plain;
    });

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      projects: formatted,
    });

    console.log(json(projects));
  } catch (error) {
    console.error("❌ Gagal mengambil data project:", error);
    res.status(500).json({ message: "Gagal mengambil data project", error });
  }
};

exports.setProjectToProses = async (req, res) => {
  try {
    const { id } = req.params;

    // Cari project
    const project = await Project.findByPk(id);
    if (!project)
      return res.status(404).json({ message: "Project tidak ditemukan" });

    // Update status menjadi 'proses'
    project.status = "proses";
    await project.save();

    req.app.get("io").emit("project_update");

    res.json({ message: "Status project berhasil diubah ke proses", project });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengubah status project", error });
  }
};

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
