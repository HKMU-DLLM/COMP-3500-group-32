const Database = require("better-sqlite3");
const path = require("path");

// 讓 DB 放在 /db/ 下
const dbPath = path.resolve(__dirname, "restaurant.db");
const db = new Database(dbPath);

db.exec(`
CREATE TABLE restaurants (
    name TEXT PRIMARY KEY,
    cuisine_type TEXT NOT NULL
);

CREATE TABLE customer (
    name TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE rider (
    name   TEXT PRIMARY KEY,
    reward REAL NOT NULL DEFAULT (0)
);

CREATE TABLE menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant TEXT NOT NULL,
    dish_name TEXT NOT NULL,
    price REAL NOT NULL,
    FOREIGN KEY (restaurant) REFERENCES restaurants(name)
);

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant TEXT NOT NULL,
    rating INTEGER CHECK(rating >=1 AND rating <=5),
    comment TEXT,
    FOREIGN KEY (restaurant) REFERENCES restaurants(name)
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rider_name TEXT,
    FOREIGN KEY (customer_name) REFERENCES customer(name),
    FOREIGN KEY (rider_name) REFERENCES rider(name)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_id) REFERENCES menus(id)
);
`);
console.log("✅ restaurant.db 已建立於 /db/ 資料夾。");
