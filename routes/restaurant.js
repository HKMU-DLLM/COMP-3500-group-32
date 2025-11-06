const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.get("/orders", (req, res) => {
	res.render("restaurant/orders");
});
router.get("/", (req, res) => {
	const name = req.query.name;
	const restaurant = db
		.prepare("SELECT rowid AS id, * FROM restaurants WHERE name = ?")
		.get(name);

	if (!restaurant) {
		return res.send("Restaurant not found");
	}

	const menus = db.prepare("SELECT * FROM menus WHERE restaurant = ?").all(name);
	const orders = db
		.prepare(
			`
		SELECT DISTINCT o.*
		FROM orders o
		JOIN order_items oi ON o.id = oi.order_id
		JOIN menus m ON oi.menu_id = m.id
		WHERE m.restaurant = ?
		ORDER BY o.created_at DESC
	`
		)
		.all(name);

	// Attach order_items (with dish_name + quantity)
	orders.forEach((order) => {
		order.items = db
			.prepare(
				`
			SELECT m.dish_name, oi.quantity
			FROM order_items oi
			JOIN menus m ON oi.menu_id = m.id
			WHERE oi.order_id = ?
		`
			)
			.all(order.id);
	});

	res.render("restaurant/dashboard", { restaurant, menus, orders });
});
// --- Add new menu item ---
router.post("/menu/new", (req, res) => {
	const { restaurant, dish_name, price } = req.body;

	db.prepare("INSERT INTO menus (restaurant, dish_name, price) VALUES (?, ?, ?)").run(
		restaurant,
		dish_name,
		price
	);

	res.redirect(`/restaurant?name=${encodeURIComponent(restaurant)}`);
});

// --- Edit menu item (GET + POST) ---
router.get("/menu/edit/:id", (req, res) => {
	const menu = db.prepare("SELECT * FROM menus WHERE id = ?").get(req.params.id);
	if (!menu) return res.send("Menu not found");
	res.render("restaurant/edit_menu", { menu });
});

router.post("/menu/edit/:id", (req, res) => {
	const { dish_name, price, restaurant } = req.body;

	db.prepare("UPDATE menus SET dish_name = ?, price = ? WHERE id = ?").run(
		dish_name,
		price,
		req.params.id
	);

	res.redirect(`/restaurant?name=${encodeURIComponent(restaurant)}`);
});
// Mark order as completed
router.post("/order/complete/:id", (req, res) => {
	db.prepare("UPDATE orders SET restaurant_completed = 1 WHERE id = ?").run(req.params.id);
	res.redirect("back");
});
// --- Delete menu item ---
router.post("/menu/delete/:id", (req, res) => {
	const menu = db.prepare("SELECT restaurant FROM menus WHERE id = ?").get(req.params.id);
	if (!menu) return res.send("Menu not found");

	db.prepare("DELETE FROM menus WHERE id = ?").run(req.params.id);

	res.redirect(`/restaurant?name=${encodeURIComponent(menu.restaurant)}`);
});
module.exports = router;
