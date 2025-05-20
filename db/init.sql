CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  vip INTEGER DEFAULT 0
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  price REAL,
  image TEXT
);

CREATE TABLE cart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  product_id INTEGER,
  quantity INTEGER
);

/* Přidej nějaké produkty */
INSERT INTO products (name, price, image) VALUES ('Jablko', 30.0, 'images/apple.jpg');
INSERT INTO products (name, price, image) VALUES ('Hruška', 25.0, 'images/pear.jpg');
INSERT INTO products (name, price, image) VALUES ('Banán', 20.0, 'images/banana.jpg');
