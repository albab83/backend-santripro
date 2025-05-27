const express = require("express");
const router = express.Router();
const journalController = require("../controllers/journalController");
const {
  verifyToken,
  verifySantri,
  verifyAdmin,
} = require("../middleware/authMiddleware");

// Santri kirim jurnal ke project
router.post(
  "/:projectId",
  verifyToken,
  verifySantri,
  journalController.createJournal,
);

// Lihat jurnal dari suatu project (admin atau pemilik)
router.get("/:projectId", verifyToken, journalController.getJournalsByProject);

router.put(
  "/:journalId",
  verifyToken,
  verifySantri,
  journalController.updateJournal,
);
router.delete(
  "/:journalId",
  verifyToken,
  verifySantri,
  journalController.deleteJournal,
);

module.exports = router;
