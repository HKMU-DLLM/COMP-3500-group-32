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

module.exports = router;

