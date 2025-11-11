const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
//const db = require("./db");
// Routers
const restaurantRouter = require("./routes/restaurant");
const customerRouter = require("./routes/customer");
const riderRouter = require("./routes/rider");

app.set("io", io);
// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
	console.log("New access to website");
	res.status(200).render("auth/login");
});

app.post("/login", (req, res) => {
	console.log("Login attempt:", req.body);

	const role = req.body.role;
	const name = req.body.name;
	if (!["customer", "restaurant", "rider"].includes(role)) {
		return res.redirect("/");
	}

	res.redirect(`/${role}?name=${encodeURIComponent(name)}`);
});

// Role routes
app.use("/restaurant", restaurantRouter);
app.use("/customer", customerRouter);
app.use("/rider", riderRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
