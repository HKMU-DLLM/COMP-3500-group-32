const express = require("express");
const router = express.Router();

router.get("/orders", (req, res) => {
	res.render("restaurant/orders");
});
router.get("/", (req, res) => {
	const name = req.query.name;
	res.render("restaurant/dashboard", { name: name });
});

module.exports = router;
