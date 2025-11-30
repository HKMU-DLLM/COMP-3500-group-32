const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const router = express.Router();
const dbPath = path.resolve(__dirname, "../db/db");
const db = new Database(dbPath);

// Rider Dashboard: show available orders
router.get("/", (req, res) => {
	const riderName = req.session.name;
	try {
		const myorder = db.prepare("SELECT id FROM orders WHERE rider_name = ? AND isDelivered = 0").all(riderName);
		if (myorder.length > 0) {
			return res.redirect(`/rider/order`);
		}
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
		restaurant_completed,
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
		const riderName = req.session.name || req.body.rider_name;

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

		res.status(200).json({ redirect: `/rider/order?name=${encodeURIComponent(riderName)}` });
	} catch (err) {
		console.error("❌ Error accepting order:", err);
		res.status(500).json({ error: "Failed to accept order" });
	}
});

// Rider history page
router.get("/order", (req, res) => {
	try {
		const riderName = req.session.name;
		if (!riderName) return res.status(400).send("Missing rider name");

		const orders = db
			.prepare(
				`
      SELECT 
        id,
        customer_name,
        customer_address,
        created_at,
        restaurant_name,
        restaurant_address,
		restaurant_completed,
		remaining_distance,
        distance_m,
        context
      FROM orders
      WHERE rider_name = ?
    `
			)
			.all(riderName);

		res.render("rider/order", { riderName, order: orders[0] });
	} catch (err) {
		console.error("❌ Error loading history:", err);
		res.status(500).send("Internal server error");
	}
});

router.post("/update-distance/:id", (req, res) => {
	try {
		const orderId = req.params.id;
		const distance = req.body.remaining_distance;
		db.prepare("UPDATE orders SET remaining_distance = ? WHERE id = ?").run(distance, orderId);
		res.status(200).json({ message: "Distance updated" });
		const io = req.app.get("io");
		io.emit("updateDistance", { orderID: orderId, remainingDistance: distance });
	} catch (err) {
		console.error("❌ Error loading history:", err);
		res.status(500).send("Internal server error");
	}
});

router.post("/mark-delivered/:id", (req, res) => {
	try {
		const orderId = req.params.id;
		db.prepare("UPDATE orders SET isDelivered = 1, remaining_distance = 0 WHERE id = ?").run(orderId);
		res.status(200).json({ message: "Order marked as delivered" });
		const io = req.app.get("io");
		io.emit("orderDelivered", { orderID: orderId});
	} catch (err) {
		console.error("❌ Error marking order as delivered:", err);
		res.status(500).send("Internal server error");
	}
});
module.exports = router;
