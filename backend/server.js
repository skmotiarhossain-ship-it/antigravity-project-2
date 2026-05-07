const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const mongoUri = process.env.MONGO_URI;
console.log('MONGO_URI starts with:', mongoUri ? mongoUri.substring(0, 15) + '...' : 'UNDEFINED');

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to Antigravity MongoDB'))
  .catch(err => console.log('Connection Error:', err.message));

// ===== DEFINE USERS HERE =====
const USERS = [
  { username: "saifuddinsk", password: "saifuddin1" },
  { username: "kutubsk", password: "kutub2" },
  { username: "jalalsk", password: "jalal3" }
];
// =============================

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
    
    // Check against hardcoded users array
    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Return a shared identifier so all users access the same data
    res.status(200).json({ userId: 'shared-data', username: user.username });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    const userId = 'shared-data';

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

app.get('/api/state', async (req, res) => {
  try {
    const userId = 'shared-data';

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
