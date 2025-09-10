const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost/donation-platform', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
});
const DonationSchema = new mongoose.Schema({
  user: String,
  amount: Number,
  campaign: String,
  date: { type: Date, default: Date.now }
});
DonationSchema.index({ user: 1, date: -1 }); // Optimize queries
const User = mongoose.model('User', UserSchema);
const Donation = mongoose.model('Donation', DonationSchema);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });
    const user = new User({ email, password });
    await user.save();
    res.json({ message: 'Registration successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ email }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/donate', authenticateToken, async (req, res) => {
  const { amount, campaign } = req.body;
  if (!amount || amount <= 0 || !campaign) {
    return res.status(400).json({ error: 'Invalid donation details' });
  }
  try {
    const donation = new Donation({ user: req.user.email, amount, campaign });
    await donation.save();
    res.json({ message: 'Donation successful' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/donations', authenticateToken, async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.email }).sort({ date: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));