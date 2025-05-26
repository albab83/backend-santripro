const { Journal, Project } = require('../models');

exports.createJournal = async (req, res) => {
  try {
    const { isi, status } = req.body;
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);

    if (!project || project.user_id !== req.user.userId) {
      return res.status(403).json({ message: 'Tidak berhak mengirim jurnal ke project ini' });
    }

    const journal = await Journal.create({ isi, status, project_id: projectId });
    res.status(201).json({ message: 'Jurnal berhasil dikirim', journal });
  } catch (error) {
    res.status(500).json({ message: 'Gagal kirim jurnal', error });
  }
};

exports.getJournalsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);

    if (!project || (project.user_id !== req.user.userId && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }

    const journals = await Journal.findAll({
      where: { project_id: projectId },
      order: [['created_at', 'DESC']]
    });

    res.json({
      projectTitle: project.judul, // menambahkan judul project di response
      journals
    });
  } catch (error) {
    res.status(500).json({ message: 'Gagal ambil jurnal', error });
  }
};
