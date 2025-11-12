const express = require("express");
const router = express.Router();
const db = require("../db/db");

// Dashboard -> list restaurants
router.get("/", (req, res) => {
	try {
		const stmt = db.prepare("SELECT name, cuisine_type FROM restaurants");
		const restaurants = stmt.all();
		res.render("customer/dashboard", { restaurants });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});

// Menu page
router.get("/menu/:id", (req, res) => {
	const id = req.params.id;

	try {
		const stmt = db.prepare("SELECT * FROM menus WHERE restaurant = ?");
		const menus = stmt.all(id);
		console.log(menus);

		res.render("customer/menu", { menus });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});

router.post("/pay", (req, res) => {
	const { orderDetails } = req.body;
	try {
		const ids = Object.keys(orderDetails);
		const placeholders = ids.map(() => "?").join(",");
		const stmt = db.prepare(`SELECT * FROM menus WHERE id IN (${placeholders})`);
		const menuItems = stmt.all(...ids.map((id) => parseInt(id)));

		const mergedItems = menuItems.map((item) => ({
			...item,
			quantity: orderDetails[item.id.toString()] || 0,
		}));

		console.log(mergedItems);
		res.render("customer/payment", { mergedItems });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});

module.exports = router;
