const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Txn } = require('./models');

const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({
  id: u._id, name: u.name, email: u.email, accountNumber: u.accountNumber,
  balance: u.balance, role: u.role, frozen: u.frozen,
});
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((e) => res.status(500).json({ message: e.message }));
const money = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return n > 0 && n <= 1000000 ? n : null;
};
const newAccountNumber = async () => {
  for (;;) {
    const n = '40' + Math.floor(1e9 + Math.random() * 9e9);
    if (!(await User.exists({ accountNumber: n }))) return n;
  }
};

const auth = async (req, res, next) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
};
const active = (req, res, next) =>
  req.user.frozen ? res.status(403).json({ message: 'Your account is frozen. Contact the bank.' }) : next();
const admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Administrators only.' });

router.post('/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: 'Name, email and a password of 6+ characters are required.' });
  if (await User.exists({ email: email.toLowerCase() }))
    return res.status(400).json({ message: 'This email is already registered.' });
  const user = await User.create({
    name, email,
    password: await bcrypt.hash(password, 10),
    accountNumber: await newAccountNumber(),
    role: email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() ? 'admin' : 'customer',
  });
  res.json({ token: sign(user), user: pub(user) });
}));

router.post('/auth/login', wrap(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
    return res.status(400).json({ message: 'Incorrect email or password.' });
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', auth, (req, res) => res.json(pub(req.user)));

router.post('/deposit', auth, active, wrap(async (req, res) => {
  const amt = money(req.body.amount);
  if (!amt) return res.status(400).json({ message: 'Enter an amount between 0.01 and 1,000,000.' });
  const u = await User.findByIdAndUpdate(req.user._id, { $inc: { balance: amt } }, { new: true });
  await Txn.create({ type: 'deposit', toAcc: u.accountNumber, amount: amt, note: 'Deposit' });
  res.json(pub(u));
}));

router.post('/withdraw', auth, active, wrap(async (req, res) => {
  const amt = money(req.body.amount);
  if (!amt) return res.status(400).json({ message: 'Enter an amount between 0.01 and 1,000,000.' });
  const u = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amt } }, { $inc: { balance: -amt } }, { new: true });
  if (!u) return res.status(400).json({ message: 'Insufficient balance.' });
  await Txn.create({ type: 'withdraw', fromAcc: u.accountNumber, amount: amt, note: 'Withdrawal' });
  res.json(pub(u));
}));

router.post('/transfer', auth, active, wrap(async (req, res) => {
  const amt = money(req.body.amount);
  const to = String(req.body.toAccount || '').replace(/\s/g, '');
  if (!amt) return res.status(400).json({ message: 'Enter a valid amount.' });
  if (to === req.user.accountNumber) return res.status(400).json({ message: 'You cannot transfer to your own account.' });
  const recipient = await User.findOne({ accountNumber: to });
  if (!recipient) return res.status(404).json({ message: 'Recipient account not found.' });
  if (recipient.frozen) return res.status(400).json({ message: 'Recipient account is unavailable.' });
  const sender = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amt } }, { $inc: { balance: -amt } }, { new: true });
  if (!sender) return res.status(400).json({ message: 'Insufficient balance.' });
  await User.updateOne({ _id: recipient._id }, { $inc: { balance: amt } });
  await Txn.create({
    type: 'transfer', fromAcc: sender.accountNumber, toAcc: to, amount: amt,
    note: (req.body.note || '').slice(0, 80) || `Transfer to ${recipient.name}`,
  });
  res.json(pub(sender));
}));

router.get('/transactions', auth, wrap(async (req, res) => {
  const acc = req.user.accountNumber;
  res.json(await Txn.find({ $or: [{ fromAcc: acc }, { toAcc: acc }] }).sort('-createdAt').limit(100));
}));

router.get('/admin/users', auth, admin, wrap(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  res.json(users.map(pub));
}));

router.patch('/admin/users/:id/freeze', auth, admin, wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found.' });
  if (u.role === 'admin') return res.status(400).json({ message: 'Administrators cannot be frozen.' });
  u.frozen = !u.frozen;
  await u.save();
  res.json(pub(u));
}));

module.exports = router;
