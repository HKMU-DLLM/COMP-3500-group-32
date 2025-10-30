const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.render("customer/dashboard");
});

router.get("/menu", (req, res) => {
	res.render("customer/menu");
});

module.exports = router;
