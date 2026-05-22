const express = require("express");
const router = express.Router();
const {
    createAccount,
    getAccounts,
    updateAccount,
    deleteAccount,
    transferFunds,
} = require("../controllers/accountController");
const { protect } = require("../middleware/auth");

// All routes require login
router.use(protect);

router.route("/").post(createAccount).get(getAccounts);
router.route("/:id").put(updateAccount).delete(deleteAccount);
router.post("/transfer", transferFunds);

module.exports = router;