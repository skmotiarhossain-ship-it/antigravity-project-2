const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const mongoUri = process.env.MONGO_URI;
console.log('MONGO_URI starts with:', mongoUri ? mongoUri.substring(0, 15) + '...' : 'UNDEFINED');

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_default_secret_key_change_me';

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to Antigravity MongoDB'))
  .catch(err => console.log('Connection Error:', err.message));

// ===== DEFINE USERS HERE =====
const USERS = [
  { username: "saifuddinsk", passwordHash: bcrypt.hashSync("saifuddin1", 10), displayName: "Saifuddin" },
  { username: "kutubsk", passwordHash: bcrypt.hashSync("kutub2", 10), displayName: "Kutub" },
  { username: "jalalsk", passwordHash: bcrypt.hashSync("jalal3", 10), displayName: "Jalal" }
];
// =============================

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const appStateSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
}, { timestamps: true });

const AppState = mongoose.model('AppState', appStateSchema);

// Health check / root route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Antigravity API is running' });
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = USERS.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: 'shared-data', username: user.username, displayName: user.displayName },
      JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );
    
    res.status(200).json({ 
      token,
      user: {
        userId: 'shared-data',
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protect state endpoints with JWT middleware
app.post('/api/state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Will be 'shared-data'

    const savedState = await AppState.findOneAndUpdate(
      { userId },
      { data: req.body },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'State saved' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Will be 'shared-data'

    const stateDoc = await AppState.findOne({ userId });
    if (stateDoc) {
      res.json(stateDoc.data);
    } else {
      res.status(404).json({ message: 'No state found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
