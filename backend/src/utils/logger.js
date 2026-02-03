const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };

        this.currentLevel = this.logLevels[process.env.LOG_LEVEL] || this.logLevels.INFO;
        this.logDir = path.join(__dirname, '../../logs');
        
        // Ensure log directory exists
        this.ensureLogDirectory();
        
        // Set up log rotation (daily logs)
        this.setupLogRotation();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Set up daily log rotation
     */
    setupLogRotation() {
        // Rotate logs daily at midnight
        setInterval(() => {
            this.rotateLogs();
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Rotate log files (keep last 30 days)
     */
    rotateLogs() {
        try {
            const files = fs.readdirSync(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            // Sort by modification time (oldest first)
            logFiles.sort((a, b) => {
                const statA = fs.statSync(path.join(this.logDir, a));
                const statB = fs.statSync(path.join(this.logDir, b));
                return statA.mtime - statB.mtime;
            });

            // Keep only last 30 days
            if (logFiles.length > 30) {
                const filesToDelete = logFiles.slice(0, logFiles.length - 30);
                filesToDelete.forEach(file => {
                    fs.unlinkSync(path.join(this.logDir, file));
                    console.log(`Rotated out old log file: ${file}`);
                });
            }
        } catch (error) {
            console.error('Error during log rotation:', error);
        }
    }

    /**
     * Format log entry as JSON
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     * @returns {string} Formatted log entry
     */
    formatLogEntry(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const processId = process.pid;
        const memoryUsage = process.memoryUsage();
        
        const logEntry = {
            timestamp,
            level,
            message,
            processId,
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) // MB
            },
            ...metadata
        };

        return JSON.stringify(logEntry);
    }

    /**
     * Write log to file
     * @param {string} formattedEntry - Formatted log entry
     * @param {string} level - Log level
     */
    writeToFile(formattedEntry, level) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(this.logDir, `${today}.log`);
            
            fs.appendFileSync(logFile, formattedEntry + '\n', 'utf8');
            
            // Also log to console for ERROR and WARN levels
            if (level === 'ERROR' || level === 'WARN') {
                console.error(formattedEntry);
            }
        } catch (error) {
            console.error('Failed to write log to file:', error);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    debug(message, metadata = {}) {
        if (this.currentLevel <= this.logLevels.DEBUG) {
            const formattedEntry = this.formatLogEntry('DEBUG', message, metadata);
            this.writeToFile(formattedEntry, 'DEBUG');
        }
    }

    /**
     * Log info message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    info(message, metadata = {}) {
        if (this.currentLevel <= this.logLevels.INFO) {
            const formattedEntry = this.formatLogEntry('INFO', message, metadata);
            this.writeToFile(formattedEntry, 'INFO');
        }
    }

    /**
     * Log warning message
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata
     */
    warn(message, metadata = {}) {
        if (this.currentLevel <= this.logLevels.WARN) {
            const formattedEntry = this.formatLogEntry('WARN', message, metadata);
            this.writeToFile(formattedEntry, 'WARN');
        }
    }

    /**
     * Log error message
     * @param {string} message - Log message
     * @param {Object} error - Error object
     * @param {Object} metadata - Additional metadata
     */
    error(message, error = null, metadata = {}) {
        if (this.currentLevel <= this.logLevels.ERROR) {
            const errorMetadata = {
                ...metadata,
                error: error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                } : null
            };
            
            const formattedEntry = this.formatLogEntry('ERROR', message, errorMetadata);
            this.writeToFile(formattedEntry, 'ERROR');
        }
    }

    /**
     * Log API request
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} responseTime - Response time in milliseconds
     */
    logAPIRequest(req, res, responseTime) {
        const metadata = {
            type: 'api_request',
            method: req.method,
            url: req.originalUrl,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress,
            statusCode: res.statusCode,
            responseTime: responseTime,
            contentLength: res.get('content-length') || 0
        };

        const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`;
        
        if (res.statusCode >= 400) {
            this.warn(message, metadata);
        } else {
            this.info(message, metadata);
        }
    }

    /**
     * Log database query
     * @param {string} query - SQL query
     * @param {number} duration - Query duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    logDatabaseQuery(query, duration, metadata = {}) {
        const logMetadata = {
            type: 'database_query',
            query: query.substring(0, 200), // Log first 200 chars to avoid sensitive data
            duration,
            ...metadata
        };

        const message = `Database query executed in ${duration}ms`;
        
        if (duration > 1000) {
            this.warn(message, logMetadata);
        } else {
            this.debug(message, logMetadata);
        }
    }

    /**
     * Log AI service call
     * @param {string} service - AI service name
     * @param {string} action - Action performed
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    logAIServiceCall(service, action, duration, metadata = {}) {
        const logMetadata = {
            type: 'ai_service_call',
            service,
            action,
            duration,
            ...metadata
        };

        const message = `AI Service: ${service}.${action} completed in ${duration}ms`;
        
        if (duration > 5000) {
            this.warn(message, logMetadata);
        } else {
            this.info(message, logMetadata);
        }
    }

    /**
     * Log user action
     * @param {string} userId - User ID
     * @param {string} action - User action
     * @param {Object} metadata - Additional metadata
     */
    logUserAction(userId, action, metadata = {}) {
        const logMetadata = {
            type: 'user_action',
            userId: userId || 'anonymous',
            action,
            ...metadata
        };

        const message = `User action: ${action}`;
        this.info(message, logMetadata);
    }

    /**
     * Log security event
     * @param {string} event - Security event type
     * @param {string} message - Event message
     * @param {Object} metadata - Additional metadata
     */
    logSecurityEvent(event, message, metadata = {}) {
        const logMetadata = {
            type: 'security_event',
            event,
            ...metadata
        };

        this.warn(message, logMetadata);
    }

    /**
     * Log performance metric
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} metadata - Additional metadata
     */
    logPerformanceMetric(metric, value, metadata = {}) {
        const logMetadata = {
            type: 'performance_metric',
            metric,
            value,
            unit: metadata.unit || 'ms',
            ...metadata
        };

        const message = `Performance metric: ${metric} = ${value}${logMetadata.unit}`;
        this.info(message, logMetadata);
    }

    /**
     * Log business event
     * @param {string} event - Business event
     * @param {Object} metadata - Event metadata
     */
    logBusinessEvent(event, metadata = {}) {
        const logMetadata = {
            type: 'business_event',
            event,
            ...metadata
        };

        const message = `Business event: ${event}`;
        this.info(message, logMetadata);
    }

    /**
     * Log system startup
     * @param {Object} metadata - Startup metadata
     */
    logSystemStartup(metadata = {}) {
        const logMetadata = {
            type: 'system_startup',
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            ...metadata
        };

        const message = 'System started successfully';
        this.info(message, logMetadata);
    }

    /**
     * Log system shutdown
     * @param {string} reason - Shutdown reason
     * @param {Object} metadata - Additional metadata
     */
    logSystemShutdown(reason = 'unknown', metadata = {}) {
        const logMetadata = {
            type: 'system_shutdown',
            reason,
            uptime: process.uptime(),
            ...metadata
        };

        const message = `System shutting down: ${reason}`;
        this.info(message, logMetadata);
    }

    /**
     * Log batch operation
     * @param {string} operation - Operation name
     * @param {number} totalItems - Total items processed
     * @param {number} successfulItems - Successfully processed items
     * @param {number} failedItems - Failed items
     * @param {number} duration - Duration in milliseconds
     * @param {Object} metadata - Additional metadata
     */
    logBatchOperation(operation, totalItems, successfulItems, failedItems, duration, metadata = {}) {
        const logMetadata = {
            type: 'batch_operation',
            operation,
            totalItems,
            successfulItems,
            failedItems,
            successRate: totalItems > 0 ? (successfulItems / totalItems) * 100 : 0,
            duration,
            itemsPerSecond: duration > 0 ? (totalItems / (duration / 1000)) : 0,
            ...metadata
        };

        const message = `Batch operation ${operation}: ${successfulItems}/${totalItems} successful in ${duration}ms`;
        
        if (failedItems > totalItems * 0.1) { // More than 10% failed
            this.warn(message, logMetadata);
        } else {
            this.info(message, logMetadata);
        }
    }

    /**
     * Get log statistics
     * @returns {Object} Log statistics
     */
    getLogStatistics() {
        try {
            const files = fs.readdirSync(this.logDir);
            const logFiles = files.filter(file => file.endsWith('.log'));
            
            let totalSize = 0;
            logFiles.forEach(file => {
                const stats = fs.statSync(path.join(this.logDir, file));
                totalSize += stats.size;
            });

            return {
                totalLogFiles: logFiles.length,
                totalLogSizeBytes: totalSize,
                totalLogSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
                oldestLog: logFiles.length > 0 ? logFiles.sort()[0] : null,
                newestLog: logFiles.length > 0 ? logFiles.sort()[logFiles.length - 1] : null,
                logDirectory: this.logDir
            };
        } catch (error) {
            this.error('Failed to get log statistics', error);
            return {
                error: 'Failed to get log statistics',
                message: error.message
            };
        }
    }

    /**
     * Clean old logs manually
     * @param {number} daysToKeep - Number of days to keep (default: 30)
     */
    cleanOldLogs(daysToKeep = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const files = fs.readdirSync(this.logDir);
            let deletedCount = 0;
            let freedSpace = 0;

            files.forEach(file => {
                if (file.endsWith('.log')) {
                    const filePath = path.join(this.logDir, file);
                    const stats = fs.statSync(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        freedSpace += stats.size;
                        fs.unlinkSync(filePath);
                        deletedCount++;
                        this.info(`Deleted old log file: ${file}`, {
                            type: 'log_cleanup',
                            fileName: file,
                            fileSize: stats.size,
                            fileAge: Date.now() - stats.mtime
                        });
                    }
                }
            });

            this.info(`Log cleanup completed: ${deletedCount} files deleted, ${Math.round(freedSpace / 1024 / 1024 * 100) / 100}MB freed`, {
                type: 'log_cleanup_summary',
                deletedCount,
                freedSpaceBytes: freedSpace
            });

        } catch (error) {
            this.error('Failed to clean old logs', error, {
                type: 'log_cleanup_error'
            });
        }
    }
}

// Create and export singleton instance
const logger = new Logger();

// Handle process events
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error, { type: 'uncaught_exception' });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', reason, { 
        type: 'unhandled_rejection',
        promise: promise.toString()
    });
});

process.on('SIGTERM', () => {
    logger.logSystemShutdown('SIGTERM received');
});

process.on('SIGINT', () => {
    logger.logSystemShutdown('SIGINT received');
});

// Log system startup
logger.logSystemStartup({
    env: process.env.NODE_ENV || 'development',
    args: process.argv.slice(2)
});

module.exports = logger;