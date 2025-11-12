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
	const orderDetails = JSON.parse(req.body.orderDetails);

	console.log("Received orderDetails:", orderDetails);
	try {
		const ids = Object.keys(orderDetails);
		const placeholders = ids.map(() => "?").join(",");
		const stmt = db.prepare(`SELECT * FROM menus WHERE id IN (${placeholders})`);
		const menuItems = stmt.all(...ids.map((id) => parseInt(id)));

		const mergedItems = menuItems.map((item) => ({
			...item,
			quantity: orderDetails[item.id.toString()] || 0,
		}));

		res.render("customer/payment", { mergedItems: mergedItems });
	} catch (err) {
		console.error(err);
		res.status(500).send("Database error");
	}
});
router.post("/neworder", (req, res) => {
	const { itemIds, quantities } = req.body;
	console.log("Received item IDs:", itemIds);
	console.log("Received quantities:", quantities);

	const customerName = req.session.name || "Guest";

	try {
		// 1. Validate input
		if (
			!itemIds ||
			!quantities ||
			itemIds.length === 0 ||
			itemIds.length !== quantities.length
		) {
			return res.status(400).send("No items in order or mismatched data");
		}

		// 2. Create orderDetails map from arrays
		const orderDetails = {};
		itemIds.forEach((id, index) => {
			orderDetails[id] = parseInt(quantities[index]);
		});

		// 3. Fetch menu details securely from DB
		const placeholders = itemIds.map(() => "?").join(",");
		const stmt = db.prepare(`
			SELECT m.id, m.dish_name, m.price, m.restaurant, r.address AS restaurant_address
			FROM menus m
			JOIN restaurants r ON m.restaurant = r.name
			WHERE m.id IN (${placeholders})
		`);
		const menuItems = stmt.all(...itemIds.map((id) => parseInt(id)));

		// 4. Calculate total and create context string
		let total = 10; // delivery fee
		let contextArray = [];
		let restaurantName = "";
		let restaurantAddress = "";

		for (const item of menuItems) {
			const qty = orderDetails[item.id];
			if (isNaN(qty) || qty <= 0) continue;

			const subtotal = item.price * qty;
			total += subtotal;
			contextArray.push(`${item.dish_name} x${qty} ($${subtotal.toFixed(2)})`);

			// All items assumed to be from the same restaurant
			restaurantName = item.restaurant;
			restaurantAddress = item.restaurant_address;
		}

		if (contextArray.length === 0) return res.status(400).send("Invalid order items");

		const contextString = contextArray.join(", ");

		// 5. Fetch customer address
		const customer = db
			.prepare("SELECT address FROM customer WHERE name = ?")
			.get(customerName);

		if (!customer) return res.status(400).send("Customer not found");

		const customerAddress = customer.address;

		// 6. Insert into orders table
		const insertOrder = db.prepare(`
			INSERT INTO orders (
				customer_name,
				customer_address,
				restaurant_name,
				restaurant_address,
				context,
				created_at,
				restaurant_completed
			)
			VALUES (?, ?, ?, ?, ?, datetime('now'), 0)
		`);

		insertOrder.run(
			customerName,
			customerAddress,
			restaurantName,
			restaurantAddress,
			contextString
		);

		const io = req.app.get("io");
		io.emit("newOrder", { restaurantName });

		res.send("✅ Order placed successfully and verified on server!");
	} catch (err) {
		console.error("❌ Failed to insert order:", err);
		res.status(500).send("Failed to store order.");
	}
});

module.exports = router;
