const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const router = express.Router();
const dbPath = path.resolve(__dirname, "../db/restaurant.db");
const db = new Database(dbPath);

// Rider Dashboard: show available orders
router.get("/", (req, res) => {
	try {
		const orders = db
			.prepare(
				`
      SELECT 
        id,
        customer_name,
        customer_address,
        created_at,
        rider_name,
        restaurant_name,
        restaurant_address,
        distance_m,
        context
      FROM orders
      WHERE rider_name IS NULL
    `
			)
			.all();

		res.render("rider/dashboard", { orders });
	} catch (err) {
		console.error("❌ Error loading dashboard:", err);
		res.status(500).send("Internal server error");
	}
});

// Accept order
router.post("/accept/:id", (req, res) => {
	try {
		const orderId = req.params.id;
		const riderName = req.query.name || req.body.rider_name;

		if (!riderName) return res.status(400).json({ error: "Missing rider name" });

		// Auto-create rider if not exist
		const riderCheck = db.prepare("SELECT name FROM rider WHERE name = ?").get(riderName);
		if (!riderCheck) {
			db.prepare("INSERT INTO rider (name, reward) VALUES (?, 0)").run(riderName);
			console.log(`🆕 Rider ${riderName} created.`);
		}

		// Check order
		const orderCheck = db.prepare("SELECT rider_name FROM orders WHERE id = ?").get(orderId);
		if (!orderCheck) return res.status(404).json({ error: "Order not found" });
		if (orderCheck.rider_name) return res.status(400).json({ error: "Order already taken" });

		// Accept order
		db.prepare("UPDATE orders SET rider_name = ? WHERE id = ?").run(riderName, orderId);
		console.log(`✅ Order ${orderId} accepted by ${riderName}`);

		res.status(200).json({ message: "Order accepted" });
	} catch (err) {
		console.error("❌ Error accepting order:", err);
		res.status(500).json({ error: "Failed to accept order" });
	}
});

// Rider history page
router.get("/history", (req, res) => {
	try {
		const riderName = req.query.name;
		if (!riderName) return res.status(400).send("Missing rider name");

		const orders = db
			.prepare(
				`
      SELECT 
        o.id,
        o.customer_name,
        o.customer_address,
        o.created_at,
        o.rider_name,
        o.restaurant_name,
        o.restaurant_address,
        GROUP_CONCAT(m.dish_name || ' x' || oi.quantity, ', ') AS order_items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN menus m ON oi.menu_id = m.id
      WHERE o.rider_name = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
			)
			.all(riderName);

		res.render("rider/history", { riderName, orders });
	} catch (err) {
		console.error("❌ Error loading history:", err);
		res.status(500).send("Internal server error");
	}
});

module.exports = router;
