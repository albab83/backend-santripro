const { Project, User } = require('../models');

exports.createProject = async (req, res) => {
  try {
    const { title, description, file_url } = req.body;
    const user_id = req.user.id;

    const project = await Project.create({ title, description, file_url, user_id });
    res.status(201).json({ message: 'Proposal berhasil dikirim', project });
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat project', error });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: { model: User, attributes: ['name', 'email'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data project' });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const user_id = req.user.id;
    const projects = await Project.findAll({ where: { user_id } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil project milik sendiri' });
  }
};

exports.approveProject = async (req, res) => {
  try {
    const id = req.params.id;
    await Project.update({ status: 'accepted', rejection_reason: null }, { where: { id } });
    res.json({ message: 'Proposal disetujui' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyetujui proposal' });
  }
};

exports.rejectProject = async (req, res) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });

    await Project.update({ status: 'rejected', rejection_reason: reason }, { where: { id } });
    res.json({ message: 'Proposal ditolak' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menolak proposal' });
  }
};
