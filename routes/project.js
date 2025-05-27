const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const {
  verifyToken,
  verifySantri,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Santri mengajukan proposal
router.post("/", verifyToken, verifySantri, projectController.createProject);

// Admin melihat semua proposal
router.get("/", verifyToken, verifyAdmin, projectController.getAllProjects);

// Admin menyetujui proposal
router.put(
  "/:id/approve",
  verifyToken,
  verifyAdmin,
  projectController.approveProject
);

// Admin menolak proposal
router.put(
  "/:id/reject",
  verifyToken,
  verifyAdmin,
  projectController.rejectProject
);

// Santri atau admin melihat proposal miliknya
router.get("/my", verifyToken, projectController.getMyProjects);

//merubah status project

router.put(
  "/:id/status",
  verifyToken,
  verifySantri,
  projectController.finishProject
);

module.exports = router;
