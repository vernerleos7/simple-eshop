const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const app = express();
const dbFile = "./db/eshop.db";
const db = new sqlite3.Database(dbFile);

// Inicializace DB, pokud neexistuje
if (!fs.existsSync(dbFile)) {
  const initSql = fs.readFileSync("./db/init.sql", "utf8");
  db.exec(initSql);
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: "tajneheslo",
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware pro kontrolu přihlášení
function checkAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Hlavní stránka — výpis produktů
app.get("/", (req, res) => {
  db.all("SELECT * FROM products", (err, products) => {
    if (err) return res.send("Chyba databáze");
    const user = req.session.user || {};
    res.render("index", { products, user });
  });
});

// Registrace
app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  const { username, password, vip } = req.body;
  if (!username || !password) return res.send("Vyplň všechna pole");

  const hash = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password, vip) VALUES (?, ?, ?)",
    [username, hash, vip ? 1 : 0],
    (err) => {
      if (err) return res.send("Uživatel již existuje");
      res.redirect("/login");
    }
  );
});

// Login
app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (!user) return res.send("Neplatné uživatelské jméno nebo heslo");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.send("Neplatné uživatelské jméno nebo heslo");

    req.session.user = user;
    res.redirect("/");
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Přidání produktu do košíku
app.post("/add-to-cart", checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const productId = req.body.id;

  db.get("SELECT * FROM cart WHERE user_id = ? AND product_id = ?", [userId, productId], (err, row) => {
    if (row) {
      db.run("UPDATE cart SET quantity = quantity + 1 WHERE id = ?", [row.id]);
    } else {
      db.run("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, 1)", [userId, productId]);
    }
    res.redirect("/");
  });
});

// Zobrazení košíku
app.get("/cart", checkAuth, (req, res) => {
  const userId = req.session.user.id;
  const isVip = req.session.user.vip;

  db.all(`
    SELECT p.name, p.price, p.image, c.quantity
    FROM cart c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
  `, [userId], (err, items) => {
    if (err) return res.send("Chyba databáze");
    let total = 0;
    const updatedItems = items.map(item => {
      let price = isVip ? item.price * 0.7 : item.price; // VIP sleva 30%
      if (item.quantity >= 10) price *= 0.9; // Sleva 10% při 10+ kusech
      const finalPrice = price * item.quantity;
      total += finalPrice;
      return {...item, finalPrice};
    });
    res.render("cart", { items: updatedItems, total });
  });
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server běží na http://localhost:${PORT}`);
});
