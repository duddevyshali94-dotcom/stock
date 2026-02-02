const express = require('express');
const authService = require('../services/authService');
const { authenticateUser } = require('../middleware/authMiddleware');
const { requireFields } = require('../utils/validation');

const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  requireFields(req.body, ['email', 'password']);

  const data = await authService.signUp(email, password, role || 'user');

  res.status(201).json({
    success: true,
    data
  });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  requireFields(req.body, ['email', 'password']);

  const data = await authService.login(email, password);

  res.json({
    success: true,
    data
  });
}));

router.post('/logout', authenticateUser, asyncHandler(async (req, res) => {
  await authService.logout(req.token);
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

router.get('/me', authenticateUser, asyncHandler(async (req, res) => {
  const role = await authService.getUserRole(req.user.id);
  res.json({
    success: true,
    data: {
      ...req.user,
      role
    }
  });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token: refreshToken } = req.body;
  requireFields(req.body, ['refresh_token']);

  const data = await authService.refreshToken(refreshToken);

  res.json({
    success: true,
    data
  });
}));

module.exports = router;
