const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/admin/users?search=&page=1&pageSize=10
router.get('/users', async (req, res) => {
  const { search = '', page = 1, pageSize = 10 } = req.query;
  const query = search
    ? {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    : {};
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .skip((page - 1) * pageSize)
    .limit(Number(pageSize));
  res.json({ users, total });
});

module.exports = router;
