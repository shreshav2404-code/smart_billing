const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const qrcode = require('qrcode');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const STARTED_AT = new Date().toISOString();

// Serve static files from the frontend build directory. Vite fingerprints
// everything under /assets, so those can be cached forever; index.html must
// always be revalidated so a redeploy is picked up immediately.
app.use(express.static(path.join(__dirname, '../frontend/dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// Utility function to generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Database connection
const dbPath = path.join(__dirname, '../database/smart_retail.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Auto-initialize Settings table
    db.serialize(() => {
      db.run('CREATE TABLE IF NOT EXISTS Settings (Key TEXT PRIMARY KEY, Value TEXT)');
      db.run("INSERT OR IGNORE INTO Settings (Key, Value) VALUES ('ML_MIN_SUPPORT', '0.05')");
      db.run("INSERT OR IGNORE INTO Settings (Key, Value) VALUES ('ML_MIN_CONFIDENCE', '0.1')");
    });
  }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Middleware to verify if user is an owner
const verifyOwner = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: 'Access denied: Owner only' });
    }
    next();
  });
};

// Routes

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username?.trim() || !email?.trim() || typeof password !== 'string') {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO Users (Username, Email, Password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          return res.status(500).json({ message: err.message });
        }
        res.status(201).json({ message: 'User registered successfully' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Error hashing password' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(
    'SELECT * FROM Users WHERE Email = ?',
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
      const validPassword = await bcrypt.compare(password, user.Password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid password' });
      }
      const token = jwt.sign({ id: user.UserID, email: user.Email, role: user.Role }, process.env.JWT_SECRET || 'fallback_secret');
      res.json({ token, user: { id: user.UserID, username: user.Username, email: user.Email, role: user.Role } });
    }
  );
});

// Guest Login Route
app.post('/api/auth/guest-login', (req, res) => {
  db.get(
    'SELECT * FROM Users WHERE Email = ?',
    ['guest@example.com'],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      // If guest user doesn't exist, create one
      if (!user) {
        const hashedPassword = await bcrypt.hash('guestpassword123', 10);
        db.run(
          'INSERT INTO Users (Username, Email, Password, Role) VALUES (?, ?, ?, ?)',
          ['Guest', 'guest@example.com', hashedPassword, 'customer'],
          function (err) {
            if (err) {
              return res.status(500).json({ message: 'Could not create guest account' });
            }
            const newUserId = this.lastID;
            const token = jwt.sign({ id: newUserId, email: 'guest@example.com', role: 'customer' }, process.env.JWT_SECRET || 'fallback_secret');
            return res.json({ token, user: { id: newUserId, username: 'Guest', email: 'guest@example.com', role: 'customer' } });
          }
        );
      } else {
        // Guest user exists
        const token = jwt.sign({ id: user.UserID, email: user.Email, role: user.Role }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token, user: { id: user.UserID, username: user.Username, email: user.Email, role: user.Role } });
      }
    }
  );
});

// Get current user details
app.get('/api/users/me', verifyToken, (req, res) => {
  db.get('SELECT UserID, Username, Email, Role FROM Users WHERE UserID = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  });
});

// GET Global ML Settings
app.get('/api/settings/ml', (req, res) => {
  db.all("SELECT Key, Value FROM Settings WHERE Key IN ('ML_MIN_SUPPORT', 'ML_MIN_CONFIDENCE')", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    const settings = {};
    rows.forEach(row => {
      if (row.Key === 'ML_MIN_SUPPORT') settings.minSupport = parseFloat(row.Value);
      if (row.Key === 'ML_MIN_CONFIDENCE') settings.minConfidence = parseFloat(row.Value);
    });
    res.json(settings);
  });
});

// PUT Global ML Settings (Owner Only)
app.put('/api/settings/ml', verifyOwner, (req, res) => {
  const minSupport = Number(req.body.minSupport);
  const minConfidence = Number(req.body.minConfidence);
  const inRange = (v) => Number.isFinite(v) && v > 0 && v <= 1;
  if (!inRange(minSupport) || !inRange(minConfidence)) {
    return res.status(400).json({ message: 'minSupport and minConfidence must be numbers between 0 and 1' });
  }

  db.serialize(() => {
    db.run("UPDATE Settings SET Value = ? WHERE Key = 'ML_MIN_SUPPORT'", [minSupport.toString()]);
    db.run("UPDATE Settings SET Value = ? WHERE Key = 'ML_MIN_CONFIDENCE'", [minConfidence.toString()]);
  });
  res.json({ message: 'ML Settings updated globally' });
});

// Owner Login Route
app.post('/api/auth/owner-login', (req, res) => {
  db.get(
    'SELECT * FROM Users WHERE Email = ?',
    ['owner@example.com'],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      // If owner user doesn't exist, create one
      if (!user) {
        const hashedPassword = await bcrypt.hash('ownerpassword123', 10);
        db.run(
          "INSERT INTO Users (Username, Email, Password, Role) VALUES (?, ?, ?, ?)",
          ['Store Owner', 'owner@example.com', hashedPassword, 'owner'],
          function (err) {
            if (err) {
              return res.status(500).json({ message: 'Could not create owner account' });
            }
            const newUserId = this.lastID;
            const token = jwt.sign({ id: newUserId, email: 'owner@example.com', role: 'owner' }, process.env.JWT_SECRET || 'fallback_secret');
            return res.json({ token, user: { id: newUserId, username: 'Store Owner', email: 'owner@example.com', role: 'owner' } });
          }
        );
      } else {
        // Owner user exists
        const token = jwt.sign({ id: user.UserID, email: user.Email, role: user.Role }, process.env.JWT_SECRET || 'fallback_secret');
        res.json({ token, user: { id: user.UserID, username: user.Username, email: user.Email, role: user.Role } });
      }
    }
  );
});

// Accept numbers or numeric strings (form values), reject blanks, negatives and NaN.
const isValidPrice = (v) => v !== '' && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0;
const isValidStock = (v) => v !== '' && v !== null && Number.isInteger(Number(v)) && Number(v) >= 0;

// Product Routes
app.get('/api/products', (req, res) => {
  db.all('SELECT * FROM Products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(rows);
  });
});

// Add a new product (Owner Only)
app.post('/api/products', verifyOwner, (req, res) => {
  const { name, price, stock, weight, category } = req.body;
  if (!name?.trim() || price == null || stock == null) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (!isValidPrice(price) || !isValidStock(stock)) {
    return res.status(400).json({ message: 'Price must be a non-negative number and stock a non-negative whole number' });
  }

  db.run(
    'INSERT INTO Products (Name, Price, Stock, Weight, Category) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), Number(price), Number(stock), weight === '' || weight == null ? null : Number(weight), category || 'Others'],
    function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({ message: 'Product added successfully', productId: this.lastID });
    }
  );
});

// Update an existing product (Owner Only)
app.put('/api/products/:id', verifyOwner, (req, res) => {
  const productId = req.params.id;
  const { price, stock } = req.body;

  if (price == null && stock == null) {
    return res.status(400).json({ message: 'At least one field (price or stock) is required' });
  }
  if ((price != null && !isValidPrice(price)) || (stock != null && !isValidStock(stock))) {
    return res.status(400).json({ message: 'Price must be a non-negative number and stock a non-negative whole number' });
  }

  let updateQuery = 'UPDATE Products SET ';
  const updateValues = [];

  if (price != null) {
    updateQuery += 'Price = ?, ';
    updateValues.push(Number(price));
  }
  if (stock != null) {
    updateQuery += 'Stock = ?, ';
    updateValues.push(Number(stock));
  }

  // Remove trailing comma and space
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ' WHERE ProductID = ?';
  updateValues.push(productId);

  db.run(updateQuery, updateValues, function (err) {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully' });
  });
});

// Analytics Dashboard Endpoint (Owner Only)
app.get('/api/analytics', verifyOwner, async (req, res) => {
  try {
    // 1. KPIs
    const kpis = await dbGet("SELECT COUNT(*) as totalOrders, SUM(TotalAmount) as totalRevenue, (SELECT SUM(Quantity) FROM OrderItems oi JOIN Orders o ON oi.OrderID = o.OrderID WHERE o.Status = 'completed') as totalItemsSold FROM Orders WHERE Status = 'completed'");

    // 2. Revenue Over Time (Group by Date)
    const revenueOverTime = await new Promise((resolve, reject) => {
      db.all("SELECT DATE(CreatedAt) as date, SUM(TotalAmount) as revenue FROM Orders WHERE Status = 'completed' GROUP BY DATE(CreatedAt) ORDER BY date ASC LIMIT 30", [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });

    // 3. Top Products (By Quantity Sold)
    const topProducts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.Name as name, SUM(oi.Quantity) as totalSold 
        FROM OrderItems oi 
        JOIN Products p ON oi.ProductID = p.ProductID 
        JOIN Orders o ON oi.OrderID = o.OrderID 
        WHERE o.Status = 'completed' 
        GROUP BY oi.ProductID 
        ORDER BY totalSold DESC 
        LIMIT 5
      `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });

    // 4. Category Breakdown
    const categoryData = await new Promise((resolve, reject) => {
      db.all(`
        SELECT p.Category as name, SUM(oi.Quantity * oi.Price) as value 
        FROM OrderItems oi 
        JOIN Products p ON oi.ProductID = p.ProductID 
        JOIN Orders o ON oi.OrderID = o.OrderID 
        WHERE o.Status = 'completed' 
        GROUP BY p.Category 
        ORDER BY value DESC
      `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });

    res.json({
      kpis: {
        totalOrders: kpis.totalOrders || 0,
        totalRevenue: kpis.totalRevenue || 0,
        totalItemsSold: kpis.totalItemsSold || 0
      },
      revenueOverTime: revenueOverTime || [],
      topProducts: topProducts || [],
      categoryData: categoryData || []
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

// Order History Route
app.get('/api/orders', verifyToken, (req, res) => {
  const userId = req.user.id;
  db.all(
    `SELECT o.OrderID, o.TotalAmount, o.Status, o.CreatedAt,
            (SELECT COALESCE(SUM(Quantity), 0) FROM OrderItems WHERE OrderID = o.OrderID) as ItemCount,
            (SELECT GROUP_CONCAT(p.Name || ' × ' || oi.Quantity, ', ')
               FROM OrderItems oi JOIN Products p ON p.ProductID = oi.ProductID
              WHERE oi.OrderID = o.OrderID) as ItemSummary
     FROM Orders o 
     WHERE o.UserID = ? 
     ORDER BY o.CreatedAt DESC`,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(rows);
    }
  );
});

// Helper for SQLite queries returning Promises
const dbGet = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
const dbRun = (sql, params = []) => new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this) }));

// Checkout Route with Transaction
app.post('/api/checkout', verifyToken, async (req, res) => {
  const userId = req.user.id;

  // Validate and merge duplicate lines: a negative or fractional quantity
  // would otherwise lower the total and *increase* stock.
  if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }
  const merged = new Map();
  for (const item of req.body.items) {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Each item needs a valid product and a quantity of at least 1' });
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }
  const items = [...merged].map(([productId, quantity]) => ({ productId, quantity }));

  try {
    await dbRun('BEGIN TRANSACTION');

    let total = 0;

    // Check all products
    for (const item of items) {
      const product = await dbGet('SELECT Name, Price, Stock FROM Products WHERE ProductID = ?', [item.productId]);
      if (!product || product.Stock < item.quantity) {
        await dbRun('ROLLBACK');
        const message = product
          ? `Only ${product.Stock} × ${product.Name} left in stock`
          : `Product ID ${item.productId} is no longer available`;
        return res.status(400).json({ message });
      }
      total += product.Price * item.quantity;
    }

    // Process order
    const orderResult = await dbRun('INSERT INTO Orders (UserID, TotalAmount, Status) VALUES (?, ?, ?)', [userId, total, 'completed']);
    const orderId = orderResult.lastID;

    for (const item of items) {
      await dbRun(
        'INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price) SELECT ?, ?, ?, Price FROM Products WHERE ProductID = ?',
        [orderId, item.productId, item.quantity, item.productId]
      );
      await dbRun(
        'UPDATE Products SET Stock = Stock - ? WHERE ProductID = ?',
        [item.quantity, item.productId]
      );
    }

    const otp = generateOTP();
    await dbRun(
      'INSERT INTO Payments (OrderID, Amount, Status, OTP) VALUES (?, ?, ?, ?)',
      [orderId, total, 'completed', otp]
    );

    await dbRun('COMMIT');

    const qrData = JSON.stringify({ orderId, userId, total, otp }); // Embedded OTP back into QR
    qrcode.toDataURL(qrData, (err, qrCodeUrl) => {
      if (err) {
        return res.status(500).json({ message: 'QR error' });
      }
      res.json({ orderId, total, qrCodeUrl, otp });
    });

  } catch (error) {
    try {
      await dbRun('ROLLBACK');
    } catch (e) { }
    console.error(error);
    res.status(500).json({ message: error.message || 'Transaction error' });
  }
});

// Order facts shown to gate staff after a successful check (never the OTP).
const ORDER_DETAIL_COLUMNS = `o.TotalAmount as total, o.CreatedAt as createdAt,
  (SELECT COALESCE(SUM(Quantity), 0) FROM OrderItems WHERE OrderID = o.OrderID) as itemCount`;
const orderDetails = (row) => ({ orderId: row.orderId, total: row.total, createdAt: row.createdAt, itemCount: row.itemCount });

// QR Verification Route
app.post('/api/verify-qr', (req, res) => {
  // Support either full QR payload (`qrData`) or OTP-only (`otp`).
  const { qrData, otp } = req.body;

  // helper to mask OTP in logs (show only last 2 digits)
  const mask = (s) => (typeof s === 'string' ? s.replace(/.(?=.{2})/g, '*') : s);

  // OTP-only verification: find the payment that matches this OTP
  if (otp) {
    console.log(`[${new Date().toISOString()}] OTP verification attempt: ${mask(otp)}`);
    db.get(
      `SELECT o.OrderID as orderId, o.Status as orderStatus, p.Status as paymentStatus, ${ORDER_DETAIL_COLUMNS}
         FROM Payments p JOIN Orders o ON p.OrderID = o.OrderID WHERE p.OTP = ?
         ORDER BY o.CreatedAt DESC LIMIT 1`,
      [otp],
      (err, row) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] OTP lookup error:`, err.message);
          return res.status(500).json({ message: err.message });
        }
        if (!row) {
          console.log(`[${new Date().toISOString()}] OTP not found: ${mask(otp)}`);
          return res.status(404).json({ access: false, message: 'OTP not found' });
        }
        const access = row.orderStatus === 'completed' && row.paymentStatus === 'completed';
        console.log(`[${new Date().toISOString()}] OTP ${mask(otp)} matched order ${row.orderId} access=${access}`);
        return res.json({ access, ...orderDetails(row), message: access ? 'Access Granted' : 'Invalid or unpaid' });
      }
    );
    return;
  }

  // Full QR payload path
  if (!qrData) {
    return res.status(400).json({ message: 'qrData or otp required' });
  }

  try {
    const qrInfo = JSON.parse(qrData);
    const { orderId } = qrInfo;
    console.log(`[${new Date().toISOString()}] QR verification attempt for order ${orderId}`);
    db.get(
      `SELECT o.OrderID as orderId, o.Status as orderStatus, p.Status as paymentStatus, p.OTP as otp, ${ORDER_DETAIL_COLUMNS}
         FROM Orders o JOIN Payments p ON o.OrderID = p.OrderID WHERE o.OrderID = ?`,
      [orderId],
      (err, row) => {
        if (err) {
          console.error(`[${new Date().toISOString()}] QR lookup error for order ${orderId}:`, err.message);
          return res.status(500).json({ message: err.message });
        }
        if (!row) {
          console.log(`[${new Date().toISOString()}] Order not found: ${orderId}`);
          return res.status(404).json({ message: 'Order not found' });
        }
        // The QR embeds the order's OTP; without this check anyone could forge
        // a pass by writing {"orderId": N} into a QR code.
        if (String(qrInfo.otp ?? '') !== String(row.otp)) {
          console.log(`[${new Date().toISOString()}] QR OTP mismatch for order ${orderId}`);
          return res.json({ access: false, orderId: row.orderId, message: 'This QR code does not match the order on file' });
        }
        const access = row.orderStatus === 'completed' && row.paymentStatus === 'completed';
        console.log(`[${new Date().toISOString()}] QR check order ${orderId} access=${access}`);
        // Do NOT return the OTP value in responses
        return res.json({ access, ...orderDetails(row), message: access ? 'Access Granted' : 'Invalid or unpaid' });
      }
    );
  } catch (err) {
    res.status(400).json({ message: 'Invalid qrData payload' });
  }
});

// ML Recommendations Route (simple — for Products page)
app.post('/api/recommendations', async (req, res) => {
  const { items } = req.body; // array of productIds

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json([]);
  }

  // Sanitize input to ensure items are only integers
  const sanitizedItems = items.map(Number).filter(n => !isNaN(n));

  if (sanitizedItems.length === 0) {
    return res.json([]);
  }

  try {
    let minSupVal = 0.05;
    let minConfVal = 0.1;
    const supRow = await dbGet("SELECT Value FROM Settings WHERE Key = 'ML_MIN_SUPPORT'");
    if (supRow && supRow.Value) minSupVal = parseFloat(supRow.Value);
    const confRow = await dbGet("SELECT Value FROM Settings WHERE Key = 'ML_MIN_CONFIDENCE'");
    if (confRow && confRow.Value) minConfVal = parseFloat(confRow.Value);

    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(__dirname, '../ml/recommend.py');

    const pythonProcess = spawn(pythonPath, [
      scriptPath, 
      JSON.stringify(sanitizedItems),
      minSupVal.toString(),
      minConfVal.toString(),
      'simple'
    ]);

    let data = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk;
    });

    pythonProcess.stderr.on('data', (chunk) => {
      errorData += chunk;
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const recommendations = JSON.parse(data);
          res.json(recommendations);
        } catch (e) {
          console.error('Error parsing ML output:', e, data);
          res.json([]);
        }
      } else {
        console.error('ML Process exited with code:', code);
        console.error('Stderr:', errorData);
        res.json([]);
      }
    });
  } catch (err) {
    console.error('Database error fetching ML settings:', err);
    res.json([]);
  }
});

// ML Checkout Recommendations Route (detailed — Apriori with configurable support/confidence)
app.post('/api/checkout-recommendations', async (req, res) => {
  const { items, minSupport, minConfidence } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ recommendations: [], metadata: {} });
  }

  const sanitizedItems = items.map(Number).filter(n => !isNaN(n));
  if (sanitizedItems.length === 0) {
    return res.json({ recommendations: [], metadata: {} });
  }

  const pythonPath = process.env.PYTHON_PATH || 'python';
  const scriptPath = path.join(__dirname, '../ml/recommend.py');

  let minSupVal = minSupport != null ? parseFloat(minSupport) : 0.05;
  let minConfVal = minConfidence != null ? parseFloat(minConfidence) : 0.1;

  try {
    if (minSupport == null) {
      const row = await dbGet("SELECT Value FROM Settings WHERE Key = 'ML_MIN_SUPPORT'");
      if (row && row.Value) minSupVal = parseFloat(row.Value);
    }
    if (minConfidence == null) {
      const row = await dbGet("SELECT Value FROM Settings WHERE Key = 'ML_MIN_CONFIDENCE'");
      if (row && row.Value) minConfVal = parseFloat(row.Value);
    }
  } catch (dbErr) {
    console.error('Error fetching defaults from Settings:', dbErr);
  }

  // Pass min_support, min_confidence, and 'detailed' mode to the Python script
  const minSup = minSupVal.toString();
  const minConf = minConfVal.toString();

  const pythonProcess = spawn(pythonPath, [
    scriptPath,
    JSON.stringify(sanitizedItems),
    minSup,
    minConf,
    'detailed'
  ]);

  let data = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (chunk) => {
    data += chunk;
  });

  pythonProcess.stderr.on('data', (chunk) => {
    errorData += chunk;
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(data);

        // If result has recommendations, enrich with product details from DB
        if (result.recommendations && result.recommendations.length > 0) {
          const productIds = result.recommendations.map(r => r.productId);
          const placeholders = productIds.map(() => '?').join(',');

          db.all(
            `SELECT ProductID, Name, Price, Stock, Category FROM Products WHERE ProductID IN (${placeholders})`,
            productIds,
            (err, products) => {
              if (err) {
                console.error('Error fetching product details:', err);
                return res.json(result);
              }

              const productMap = {};
              products.forEach(p => { productMap[p.ProductID] = p; });

              result.recommendations = result.recommendations
                .map(rec => {
                  const product = productMap[rec.productId];
                  if (!product) return null;
                  return {
                    ...rec,
                    name: product.Name,
                    price: product.Price,
                    stock: product.Stock,
                    category: product.Category
                  };
                })
                .filter(Boolean);

              // Also resolve antecedent names
              const allAntecedentIds = [...new Set(result.recommendations.flatMap(r => r.antecedents))];
              if (allAntecedentIds.length > 0) {
                const antPlaceholders = allAntecedentIds.map(() => '?').join(',');
                db.all(
                  `SELECT ProductID, Name FROM Products WHERE ProductID IN (${antPlaceholders})`,
                  allAntecedentIds,
                  (err2, antProducts) => {
                    if (!err2 && antProducts) {
                      const antMap = {};
                      antProducts.forEach(p => { antMap[p.ProductID] = p.Name; });
                      result.recommendations.forEach(rec => {
                        rec.antecedentNames = rec.antecedents.map(id => antMap[id] || `Product #${id}`);
                      });
                    }
                    res.json(result);
                  }
                );
              } else {
                res.json(result);
              }
            }
          );
        } else {
          res.json(result);
        }
      } catch (e) {
        console.error('Error parsing ML output:', e, data);
        res.json({ recommendations: [], metadata: {} });
      }
    } else {
      console.error('Checkout ML Process exited with code:', code);
      console.error('Stderr:', errorData);
      res.json({ recommendations: [], metadata: {} });
    }
  });
});

// User Collaborative Recommendations Route
app.get('/api/user-recommendations', verifyToken, async (req, res) => {
  const userId = req.user.id;
  
  const pythonPath = process.env.PYTHON_PATH || 'python';
  const scriptPath = path.join(__dirname, '../ml/collaborative.py');

  const pythonProcess = spawn(pythonPath, [
    scriptPath,
    userId.toString()
  ]);

  let data = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (chunk) => {
    data += chunk;
  });

  pythonProcess.stderr.on('data', (chunk) => {
    errorData += chunk;
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const productIds = JSON.parse(data);
        if (productIds.length > 0) {
          const placeholders = productIds.map(() => '?').join(',');
          db.all(
            `SELECT ProductID, Name, Price, Stock, Category FROM Products WHERE ProductID IN (${placeholders})`,
            productIds,
            (err, products) => {
              if (err) {
                console.error('Error fetching rec product details:', err);
                return res.json([]);
              }
              // Return in the original order matching backend similarity ranking
              const productMap = {};
              products.forEach(p => { productMap[p.ProductID] = p; });
              const sortedProducts = productIds.map(id => productMap[id]).filter(Boolean);
              res.json(sortedProducts);
            }
          );
        } else {
          res.json([]);
        }
      } catch (e) {
        console.error('Error parsing collaborative ML output:', e, data);
        res.json([]);
      }
    } else {
      console.error('Collaborative ML Process exited with code:', code);
      console.error('Stderr:', errorData);
      res.json([]);
    }
  });
});

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    startedAt: STARTED_AT,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

// Unknown API routes get a JSON 404 instead of the React app's HTML.
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: `No API route for ${req.method} ${req.path}` });
});

// Catch-all route to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});