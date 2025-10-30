const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
	res.render("restaurant/dashboard");
});

router.get("/orders", (req, res) => {
	res.render("restaurant/orders");
});

module.exports = router;
