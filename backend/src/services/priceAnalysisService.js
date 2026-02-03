/**
 * Price Analysis Service
 * Provides technical analysis functions for stock price data
 */

class PriceAnalysisService {
    /**
     * Calculate Simple Moving Average
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for moving average
     * @returns {Array} Moving average values
     */
    calculateMovingAverage(prices, period) {
        if (!prices || prices.length < period) {
            return [];
        }

        const ma = [];
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            ma.push(sum / period);
        }
        return ma;
    }

    /**
     * Calculate Exponential Moving Average
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for EMA
     * @returns {Array} EMA values
     */
    calculateEMA(prices, period) {
        if (!prices || prices.length < period) {
            return [];
        }

        const multiplier = 2 / (period + 1);
        const ema = [prices[0]];

        for (let i = 1; i < prices.length; i++) {
            const currentEMA = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
            ema.push(currentEMA);
        }

        return ema;
    }

    /**
     * Calculate Relative Strength Index (RSI)
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for RSI calculation (default: 14)
     * @returns {number} RSI value
     */
    calculateRSI(prices, period = 14) {
        if (!prices || prices.length < period + 1) {
            return 50; // Neutral RSI if insufficient data
        }

        const changes = [];
        for (let i = 1; i < prices.length; i++) {
            changes.push(prices[i] - prices[i - 1]);
        }

        let gains = 0;
        let losses = 0;

        // Calculate initial averages
        for (let i = 0; i < period; i++) {
            if (changes[i] > 0) {
                gains += changes[i];
            } else {
                losses += Math.abs(changes[i]);
            }
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        // Calculate RSI for remaining periods
        for (let i = period; i < changes.length; i++) {
            if (changes[i] > 0) {
                avgGain = (avgGain * (period - 1) + changes[i]) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
            }
        }

        if (avgLoss === 0) {
            return 100; // No losses means RSI is 100
        }

        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        return Math.round(rsi * 100) / 100;
    }

    /**
     * Calculate Bollinger Bands
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for calculation (default: 20)
     * @param {number} stdDev - Standard deviation multiplier (default: 2)
     * @returns {Object} Bollinger bands with upper, middle, lower
     */
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (!prices || prices.length < period) {
            return {
                upper: null,
                middle: null,
                lower: null
            };
        }

        // Calculate simple moving average
        const sma = this.calculateMovingAverage(prices, period);
        if (sma.length === 0) {
            return {
                upper: null,
                middle: null,
                lower: null
            };
        }

        const currentSMA = sma[sma.length - 1];
        
        // Calculate standard deviation
        const recentPrices = prices.slice(-period);
        const squaredDifferences = recentPrices.map(price => Math.pow(price - currentSMA, 2));
        const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / period;
        const standardDeviation = Math.sqrt(variance);

        const upper = currentSMA + (standardDeviation * stdDev);
        const lower = currentSMA - (standardDeviation * stdDev);

        return {
            upper: Math.round(upper * 100) / 100,
            middle: Math.round(currentSMA * 100) / 100,
            lower: Math.round(lower * 100) / 100,
            bandwidth: Math.round(((upper - lower) / currentSMA) * 100 * 100) / 100 // Bandwidth as percentage
        };
    }

    /**
     * Identify price trend
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for trend analysis (default: 20)
     * @returns {string} Trend direction: 'uptrend', 'downtrend', or 'consolidation'
     */
    identifyTrend(prices, period = 20) {
        if (!prices || prices.length < period) {
            return 'consolidation';
        }

        const recentPrices = prices.slice(-period);
        const firstPrice = recentPrices[0];
        const lastPrice = recentPrices[recentPrices.length - 1];

        // Calculate percentage change
        const percentChange = ((lastPrice - firstPrice) / firstPrice) * 100;

        // Determine trend based on price movement
        if (percentChange > 2) {
            return 'uptrend';
        } else if (percentChange < -2) {
            return 'downtrend';
        } else {
            return 'consolidation';
        }
    }

    /**
     * Calculate price volatility
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for volatility calculation (default: 20)
     * @returns {number} Volatility as decimal (e.g., 0.05 = 5%)
     */
    calculateVolatility(prices, period = 20) {
        if (!prices || prices.length < period + 1) {
            return 0;
        }

        // Calculate daily returns
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            const dailyReturn = (prices[i] - prices[i - 1]) / prices[i - 1];
            returns.push(dailyReturn);
        }

        // Use recent returns for volatility calculation
        const recentReturns = returns.slice(-period);
        
        // Calculate mean return
        const meanReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
        
        // Calculate variance
        const squaredDeviations = recentReturns.map(ret => Math.pow(ret - meanReturn, 2));
        const variance = squaredDeviations.reduce((sum, sq) => sum + sq, 0) / recentReturns.length;
        
        // Calculate standard deviation (volatility)
        const volatility = Math.sqrt(variance);
        
        return Math.round(volatility * 10000) / 10000; // Round to 4 decimal places
    }

    /**
     * Calculate MACD (Moving Average Convergence Divergence)
     * @param {Array} prices - Array of price values
     * @returns {Object} MACD with signal and histogram
     */
    calculateMACD(prices) {
        if (!prices || prices.length < 26) {
            return {
                macd: 0,
                signal: 0,
                histogram: 0
            };
        }

        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);

        // MACD line
        const macd = [];
        for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
            macd.push(ema12[i] - ema26[i]);
        }

        // Signal line (EMA of MACD)
        const signal = this.calculateEMA(macd, 9);
        
        // Histogram
        const histogram = [];
        const signalStartIndex = macd.length - signal.length;
        for (let i = 0; i < signal.length; i++) {
            histogram.push(macd[signalStartIndex + i] - signal[i]);
        }

        return {
            macd: Math.round(macd[macd.length - 1] * 100) / 100,
            signal: Math.round(signal[signal.length - 1] * 100) / 100,
            histogram: Math.round(histogram[histogram.length - 1] * 100) / 100,
            trend: histogram[histogram.length - 1] > 0 ? 'bullish' : 'bearish'
        };
    }

    /**
     * Calculate Stochastic Oscillator
     * @param {Array} highs - Array of high prices
     * @param {Array} lows - Array of low prices
     * @param {Array} closes - Array of close prices
     * @param {number} period - Period for calculation (default: 14)
     * @returns {Object} Stochastic values
     */
    calculateStochastic(highs, lows, closes, period = 14) {
        if (!highs || !lows || !closes || 
            highs.length < period || lows.length < period || closes.length < period) {
            return {
                k: 50,
                d: 50,
                signal: 'neutral'
            };
        }

        const recentHighs = highs.slice(-period);
        const recentLows = lows.slice(-period);
        const recentCloses = closes.slice(-period);

        const highestHigh = Math.max(...recentHighs);
        const lowestLow = Math.min(...recentLows);
        const currentClose = recentCloses[recentCloses.length - 1];

        // %K calculation
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

        // %D is simple moving average of %K (simplified)
        const d = k; // In a full implementation, this would be SMA of %K over 3 periods

        let signal = 'neutral';
        if (k > 80) signal = 'overbought';
        else if (k < 20) signal = 'oversold';

        return {
            k: Math.round(k * 100) / 100,
            d: Math.round(d * 100) / 100,
            signal,
            level: k
        };
    }

    /**
     * Calculate Average True Range (ATR)
     * @param {Array} highs - Array of high prices
     * @param {Array} lows - Array of low prices
     * @param {Array} closes - Array of close prices
     * @param {number} period - Period for calculation (default: 14)
     * @returns {number} ATR value
     */
    calculateATR(highs, lows, closes, period = 14) {
        if (!highs || !lows || !closes || 
            highs.length < period + 1 || lows.length < period + 1 || closes.length < period + 1) {
            return 0;
        }

        const trueRanges = [];
        
        for (let i = 1; i < highs.length; i++) {
            const high = highs[i];
            const low = lows[i];
            const prevClose = closes[i - 1];
            
            const tr1 = high - low;
            const tr2 = Math.abs(high - prevClose);
            const tr3 = Math.abs(low - prevClose);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }

        // Calculate ATR as simple moving average of true ranges
        const recentTRs = trueRanges.slice(-period);
        const atr = recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
        
        return Math.round(atr * 100) / 100;
    }

    /**
     * Calculate price momentum
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for momentum calculation (default: 10)
     * @returns {Object} Momentum analysis
     */
    calculateMomentum(prices, period = 10) {
        if (!prices || prices.length < period + 1) {
            return {
                momentum: 0,
                rateOfChange: 0,
                signal: 'neutral'
            };
        }

        const currentPrice = prices[prices.length - 1];
        const pastPrice = prices[prices.length - period - 1];
        
        const momentum = currentPrice - pastPrice;
        const rateOfChange = ((currentPrice - pastPrice) / pastPrice) * 100;

        let signal = 'neutral';
        if (rateOfChange > 5) signal = 'strong_bullish';
        else if (rateOfChange > 2) signal = 'bullish';
        else if (rateOfChange < -5) signal = 'strong_bearish';
        else if (rateOfChange < -2) signal = 'bearish';

        return {
            momentum: Math.round(momentum * 100) / 100,
            rateOfChange: Math.round(rateOfChange * 100) / 100,
            signal
        };
    }

    /**
     * Identify support and resistance levels
     * @param {Array} prices - Array of price values
     * @param {number} period - Period for analysis (default: 20)
     * @returns {Object} Support and resistance levels
     */
    identifySupportResistance(prices, period = 20) {
        if (!prices || prices.length < period) {
            return {
                support: null,
                resistance: null,
                strength: 'weak'
            };
        }

        const recentPrices = prices.slice(-period);
        const sortedPrices = [...recentPrices].sort((a, b) => a - b);
        
        // Find potential support (recent lows)
        const supportLevels = [];
        for (let i = 1; i < recentPrices.length - 1; i++) {
            if (recentPrices[i] < recentPrices[i - 1] && recentPrices[i] < recentPrices[i + 1]) {
                supportLevels.push(recentPrices[i]);
            }
        }
        
        // Find potential resistance (recent highs)
        const resistanceLevels = [];
        for (let i = 1; i < recentPrices.length - 1; i++) {
            if (recentPrices[i] > recentPrices[i - 1] && recentPrices[i] > recentPrices[i + 1]) {
                resistanceLevels.push(recentPrices[i]);
            }
        }

        const support = supportLevels.length > 0 ? Math.max(...supportLevels) : sortedPrices[0];
        const resistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels) : sortedPrices[sortedPrices.length - 1];
        
        // Determine strength based on number of touches
        const strength = supportLevels.length + resistanceLevels.length > 3 ? 'strong' : 'moderate';
        
        return {
            support: Math.round(support * 100) / 100,
            resistance: Math.round(resistance * 100) / 100,
            strength
        };
    }

    /**
     * Calculate multiple technical indicators at once
     * @param {Object} priceData - Price data object with highs, lows, closes, volumes
     * @returns {Object} Complete technical analysis
     */
    calculateAllIndicators(priceData) {
        const { highs, lows, closes, volumes } = priceData;
        
        if (!closes || closes.length === 0) {
            return {
                error: 'Insufficient price data'
            };
        }

        const analysis = {
            moving_averages: {
                ma5: this.calculateMovingAverage(closes, 5),
                ma20: this.calculateMovingAverage(closes, 20),
                ma50: this.calculateMovingAverage(closes, 50)
            },
            rsi: this.calculateRSI(closes, 14),
            bollinger_bands: this.calculateBollingerBands(closes, 20, 2),
            trend: this.identifyTrend(closes, 20),
            volatility: this.calculateVolatility(closes, 20),
            momentum: this.calculateMomentum(closes, 10)
        };

        // Add MACD if we have enough data
        if (closes.length >= 26) {
            analysis.macd = this.calculateMACD(closes);
        }

        // Add ATR if we have high/low data
        if (highs && lows && highs.length === lows.length && highs.length >= 15) {
            analysis.atr = this.calculateATR(highs, lows, closes, 14);
        }

        // Add support/resistance if we have enough data
        if (closes.length >= 20) {
            const supportResistance = this.identifySupportResistance(closes, 20);
            analysis.support = supportResistance.support;
            analysis.resistance = supportResistance.resistance;
        }

        return analysis;
    }
}

module.exports = new PriceAnalysisService();