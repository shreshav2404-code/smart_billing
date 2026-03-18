-- Smart Retail Billing System Database Schema (SQLite)

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Role TEXT DEFAULT 'customer',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS Products (
    ProductID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Price REAL NOT NULL,
    Stock INTEGER NOT NULL,
    Weight REAL,
    Category TEXT DEFAULT 'Groceries',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS Orders (
    OrderID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    TotalAmount REAL NOT NULL,
    Status TEXT DEFAULT 'pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- OrderItems table
CREATE TABLE IF NOT EXISTS OrderItems (
    OrderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID INTEGER NOT NULL,
    ProductID INTEGER NOT NULL,
    Quantity INTEGER NOT NULL,
    Price REAL NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- Payments table
CREATE TABLE IF NOT EXISTS Payments (
    PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID INTEGER NOT NULL,
    Amount REAL NOT NULL,
    Status TEXT DEFAULT 'pending',
    PaymentMethod TEXT,
    OTP TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_name ON Products(Name);
CREATE INDEX IF NOT EXISTS idx_user ON Orders(UserID);
CREATE INDEX IF NOT EXISTS idx_status ON Orders(Status);
CREATE INDEX IF NOT EXISTS idx_order_items ON OrderItems(OrderID);
CREATE INDEX IF NOT EXISTS idx_product_items ON OrderItems(ProductID);
CREATE INDEX IF NOT EXISTS idx_order_payments ON Payments(OrderID);

-- Sample data
INSERT OR IGNORE INTO Products (Name, Price, Stock, Weight, Category) VALUES
('Apple', 150, 100, 0.2, 'Groceries'),
('Banana', 80, 150, 0.15, 'Groceries'),
('Orange', 200, 80, 0.25, 'Groceries'),
('Milk', 350, 50, 1.0, 'Groceries'),
('Bread', 250, 60, 0.5, 'Groceries'),
('Eggs', 400, 40, 0.6, 'Groceries'),
('Cheese', 500, 30, 0.3, 'Groceries'),
('Chicken', 800, 25, 1.5, 'Groceries'),
('Rice', 300, 70, 1.0, 'Groceries'),
('Pasta', 200, 45, 0.4, 'Groceries'),
('Yoga Mat', 1500, 15, 0.5, 'Sports'),
('Dumbbells 5kg', 2500, 20, 5.0, 'Sports'),
('Cricket Bat', 3500, 10, 1.2, 'Sports'),
('Football', 1200, 25, 0.5, 'Sports'),
('Running Shoes', 4500, 18, 0.4, 'Sports'),
('Paracetamol (strip)', 150, 100, 0.05, 'Medical'),
('Bandages', 120, 80, 0.02, 'Medical'),
('Cough Syrup', 300, 50, 0.3, 'Medical'),
('Vitamin C', 400, 60, 0.1, 'Medical'),
('Antiseptic Lotion', 250, 40, 0.2, 'Medical'),
('LED Bulb', 200, 200, 0.05, 'Electrical'),
('USB Cable', 350, 150, 0.04, 'Electrical'),
('Phone Charger', 1200, 100, 0.15, 'Electrical'),
('Power Strip', 800, 80, 0.5, 'Electrical'),
('Headphones', 2500, 60, 0.2, 'Electrical'),
('Face Wash', 350, 120, 0.2, 'Beauty'),
('Shampoo', 450, 100, 0.3, 'Beauty'),
('Moisturizer', 850, 80, 0.2, 'Beauty'),
('Lip Balm', 200, 150, 0.05, 'Beauty'),
('Sunscreen SPF50', 600, 70, 0.15, 'Beauty'),
('Nail Polish', 300, 100, 0.08, 'Beauty');