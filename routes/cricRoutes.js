const express = require("express");
const cricController = require("../controllers/cricController");

const router = express.Router();

router.get("/desc", cricController.getDescription);
router.get("/reports", cricController.getReports);
router.get("/:table", cricController.getTableData);

module.exports = router;
