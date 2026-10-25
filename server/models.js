const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    accountNumber: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    frozen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const txnSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['deposit', 'withdraw', 'transfer'], required: true },
    fromAcc: String,
    toAcc: String,
    amount: { type: Number, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = {
  User: mongoose.model('User', userSchema),
  Txn: mongoose.model('Txn', txnSchema),
};
