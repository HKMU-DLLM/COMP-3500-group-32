const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.render("rider/dashboard");
});

router.get("/deliveries", (req, res) => {
	res.render("rider/deliveries");
});

module.exports = router;
