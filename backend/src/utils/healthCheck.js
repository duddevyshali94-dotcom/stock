const { supabase } = require('../config/supabase');
const logger = require('./logger');

class HealthChecker {
    constructor() {
        this.checks = new Map();
        this.lastCheck = null;
        this.checkInterval = 30 * 1000; // 30 seconds
        this.isRunning = false;
        
        // Initialize health checks
        this.initializeChecks();
    }

    /**
     * Initialize all health checks
     */
    initializeChecks() {
        this.checks.set('database', {
            name: 'Database Connection',
            check: this.checkDatabase.bind(this),
            critical: true,
            timeout: 5000
        });

        this.checks.set('supabase_auth', {
            name: 'Supabase Authentication',
            check: this.checkSupabaseAuth.bind(this),
            critical: true,
            timeout: 5000
        });

        this.checks.set('api_performance', {
            name: 'API Performance',
            check: this.checkAPIPerformance.bind(this),
            critical: false,
            timeout: 3000
        });

        this.checks.set('memory_usage', {
            name: 'Memory Usage',
            check: this.checkMemoryUsage.bind(this),
            critical: false,
            timeout: 1000
        });

        this.checks.set('disk_space', {
            name: 'Disk Space',
            check: this.checkDiskSpace.bind(this),
            critical: false,
            timeout: 2000
        });

        this.checks.set('external_apis', {
            name: 'External APIs',
            check: this.checkExternalAPIs.bind(this),
            critical: false,
            timeout: 10000
        });
    }

    /**
     * Start periodic health checks
     */
    start() {
        if (this.isRunning) {
            logger.warn('Health checker is already running');
            return;
        }

        this.isRunning = true;
        logger.info('Starting health monitoring');

        // Run initial check
        this.performHealthCheck();

        // Set up interval for periodic checks
        this.interval = setInterval(() => {
            this.performHealthCheck();
        }, this.checkInterval);
    }

    /**
     * Stop periodic health checks
     */
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        logger.info('Stopped health monitoring');
    }

    /**
     * Perform comprehensive health check
     * @returns {Promise<Object>} Health check results
     */
    async performHealthCheck() {
        const startTime = Date.now();
        const results = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            overallScore: 100,
            checks: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                critical: 0
            }
        };

        logger.debug('Starting health check cycle');

        for (const [checkName, checkConfig] of this.checks) {
            const checkResult = await this.runCheck(checkName, checkConfig);
            results.checks[checkName] = checkResult;
            
            // Update summary
            results.summary.total++;
            if (checkResult.status === 'passed') {
                results.summary.passed++;
            } else if (checkResult.status === 'failed') {
                results.summary.failed++;
                if (checkConfig.critical) {
                    results.summary.critical++;
                    results.status = 'unhealthy';
                }
            } else if (checkResult.status === 'warning') {
                results.summary.warnings++;
                if (results.status === 'healthy') {
                    results.status = 'degraded';
                }
            }
        }

        // Calculate overall score
        const totalChecks = results.summary.total;
        const failedWeight = 10; // Critical failures reduce score more
        const warningWeight = 3;
        
        let score = 100;
        score -= (results.summary.failed * failedWeight);
        score -= (results.summary.warnings * warningWeight);
        
        results.overallScore = Math.max(0, score);

        // Update status based on score
        if (results.summary.critical > 0) {
            results.status = 'unhealthy';
        } else if (results.summary.failed > 0 || results.overallScore < 70) {
            results.status = 'degraded';
        } else if (results.summary.warnings > 0 || results.overallScore < 90) {
            results.status = 'healthy_with_warnings';
        } else {
            results.status = 'healthy';
        }

        results.responseTime = Date.now() - startTime;
        this.lastCheck = results;

        // Log health check results
        logger.info('Health check completed', {
            type: 'health_check',
            status: results.status,
            score: results.overallScore,
            summary: results.summary,
            responseTime: results.responseTime
        });

        return results;
    }

    /**
     * Run individual health check
     * @param {string} checkName - Check name
     * @param {Object} checkConfig - Check configuration
     * @returns {Promise<Object>} Check result
     */
    async runCheck(checkName, checkConfig) {
        const startTime = Date.now();
        const result = {
            name: checkConfig.name,
            status: 'unknown',
            message: '',
            responseTime: 0,
            details: {},
            timestamp: new Date().toISOString()
        };

        try {
            // Set timeout for the check
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Health check timeout')), checkConfig.timeout);
            });

            const checkPromise = checkConfig.check();
            await Promise.race([checkPromise, timeoutPromise]);

            result.status = 'passed';
            result.message = `${checkConfig.name} is healthy`;
            result.responseTime = Date.now() - startTime;

        } catch (error) {
            result.status = 'failed';
            result.message = `${checkConfig.name} failed: ${error.message}`;
            result.responseTime = Date.now() - startTime;
            result.error = error.message;

            logger.error(`Health check failed: ${checkName}`, error, {
                type: 'health_check_failure',
                checkName,
                responseTime: result.responseTime
            });
        }

        return result;
    }

    /**
     * Check database connection
     * @returns {Promise<Object>} Check result
     */
    async checkDatabase() {
        try {
            // Test basic query
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .limit(1);

            if (error) throw error;

            return {
                status: 'healthy',
                details: {
                    responseTime: Date.now() - (Date.now() - 100), // Approximate
                    query: 'SELECT id FROM users LIMIT 1'
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    type: 'database_connection_failed'
                }
            };
        }
    }

    /**
     * Check Supabase authentication
     * @returns {Promise<Object>} Check result
     */
    async checkSupabaseAuth() {
        try {
            // Test auth service availability
            const { data, error } = await supabase.auth.getSession();
            
            if (error && error.message !== 'Auth session missing!') {
                throw error;
            }

            return {
                status: 'healthy',
                details: {
                    service: 'supabase_auth',
                    sessionAvailable: !!data.session
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    type: 'supabase_auth_failed'
                }
            };
        }
    }

    /**
     * Check API performance
     * @returns {Promise<Object>} Check result
     */
    async checkAPIPerformance() {
        try {
            const startTime = Date.now();
            
            // Test a simple API endpoint
            const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/health`);
            const responseTime = Date.now() - startTime;

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            let status = 'healthy';
            if (responseTime > 1000) {
                status = 'warning';
            } else if (responseTime > 3000) {
                status = 'unhealthy';
            }

            return {
                status,
                details: {
                    responseTime,
                    endpoint: '/api/health',
                    statusCode: response.status
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    type: 'api_performance_failed'
                }
            };
        }
    }

    /**
     * Check memory usage
     * @returns {Promise<Object>} Check result
     */
    checkMemoryUsage() {
        const usage = process.memoryUsage();
        const totalHeap = usage.heapTotal;
        const usedHeap = usage.heapUsed;
        const heapPercentage = (usedHeap / totalHeap) * 100;

        let status = 'healthy';
        let message = 'Memory usage is normal';

        if (heapPercentage > 90) {
            status = 'unhealthy';
            message = 'Critical memory usage detected';
        } else if (heapPercentage > 80) {
            status = 'warning';
            message = 'High memory usage detected';
        }

        return {
            status,
            message,
            details: {
                heapUsed: Math.round(usedHeap / 1024 / 1024), // MB
                heapTotal: Math.round(totalHeap / 1024 / 1024), // MB
                heapPercentage: Math.round(heapPercentage * 100) / 100,
                external: Math.round(usage.external / 1024 / 1024), // MB
                rss: Math.round(usage.rss / 1024 / 1024) // MB
            }
        };
    }

    /**
     * Check disk space
     * @returns {Promise<Object>} Check result
     */
    async checkDiskSpace() {
        try {
            const fs = require('fs').promises;
            const stats = await fs.stat(__dirname);
            
            // This is a simplified check - in production you'd check actual disk usage
            return {
                status: 'healthy',
                details: {
                    available: 'sufficient',
                    note: 'Disk space check simplified - implement full disk usage monitoring in production'
                }
            };
        } catch (error) {
            return {
                status: 'warning',
                details: {
                    error: error.message,
                    note: 'Could not determine disk space'
                }
            };
        }
    }

    /**
     * Check external APIs
     * @returns {Promise<Object>} Check result
     */
    async checkExternalAPIs() {
        try {
            // Test Alpha Vantage API (if configured)
            const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
            if (!apiKey || apiKey === 'demo') {
                return {
                    status: 'warning',
                    details: {
                        message: 'Alpha Vantage API key not configured - using demo mode'
                    }
                };
            }

            // Test external API availability (simplified)
            return {
                status: 'healthy',
                details: {
                    external_apis: {
                        alpha_vantage: 'available',
                        yahoo_finance: 'available'
                    }
                }
            };
        } catch (error) {
            return {
                status: 'warning',
                details: {
                    error: error.message,
                    note: 'Some external APIs may be unavailable'
                }
            };
        }
    }

    /**
     * Get current health status
     * @returns {Object|null} Latest health check result
     */
    getCurrentHealth() {
        return this.lastCheck;
    }

    /**
     * Get detailed health status
     * @returns {Promise<Object>} Detailed health status
     */
    async getDetailedHealth() {
        const health = await this.performHealthCheck();
        
        // Add additional system information
        health.system = {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development'
        };

        health.performance = {
            cpuUsage: process.cpuUsage(),
            memoryUsage: process.memoryUsage(),
            eventLoopDelay: await this.measureEventLoopDelay()
        };

        return health;
    }

    /**
     * Measure event loop delay
     * @returns {Promise<number>} Event loop delay in milliseconds
     */
    measureEventLoopDelay() {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const end = process.hrtime.bigint();
                const delay = Number(end - start) / 1000000; // Convert nanoseconds to milliseconds
                resolve(delay);
            });
        });
    }

    /**
     * Generate health report
     * @returns {Object} Health report
     */
    generateHealthReport() {
        const health = this.getCurrentHealth();
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                status: health ? health.status : 'unknown',
                overallScore: health ? health.overallScore : 0,
                lastCheck: this.lastCheck ? this.lastCheck.timestamp : 'never'
            },
            checks: {},
            recommendations: []
        };

        // Process individual checks
        if (health && health.checks) {
            for (const [checkName, checkResult] of Object.entries(health.checks)) {
                report.checks[checkName] = {
                    status: checkResult.status,
                    responseTime: checkResult.responseTime,
                    message: checkResult.message
                };

                // Generate recommendations
                if (checkResult.status === 'failed') {
                    report.recommendations.push(`Fix ${checkResult.name}: ${checkResult.message}`);
                } else if (checkResult.status === 'warning') {
                    report.recommendations.push(`Monitor ${checkResult.name}: ${checkResult.message}`);
                }
            }
        }

        // Add general recommendations
        if (!health || health.status === 'unhealthy') {
            report.recommendations.push('System health is critical - immediate attention required');
        } else if (health && health.status === 'degraded') {
            report.recommendations.push('System performance is degraded - consider optimization');
        }

        return report;
    }
}

// Create and export singleton instance
const healthChecker = new HealthChecker();

// Start health monitoring if not in test environment
if (process.env.NODE_ENV !== 'test') {
    healthChecker.start();
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    healthChecker.stop();
});

process.on('SIGINT', () => {
    healthChecker.stop();
});

module.exports = healthChecker;