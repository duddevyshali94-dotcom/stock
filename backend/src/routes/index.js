const express = require('express');
const authRoutes = require('./authRoutes');
const stockRoutes = require('./stockRoutes');
const tradingRoutes = require('./tradingRoutes');
const portfolioRoutes = require('./portfolioRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/stocks', stockRoutes);
router.use('/trading', tradingRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
