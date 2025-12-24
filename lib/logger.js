const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class Logger {
    constructor() {
        this.logsDir = './logs';
        this.ensureLogsDir();
        
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        
        this.currentLevel = this.levels.INFO;
        
        // Colors for console
        this.colors = {
            ERROR: chalk.red,
            WARN: chalk.yellow,
            INFO: chalk.blue,
            DEBUG: chalk.gray,
            SUCCESS: chalk.green,
            TIME: chalk.magenta
        };
    }

    ensureLogsDir() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    getLogFileName() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `log_${year}-${month}-${day}.txt`;
    }

    formatMessage(level, message, source = '') {
        const timestamp = new Date().toISOString();
        const sourceText = source ? ` [${source}]` : '';
        return `[${timestamp}] ${level}${sourceText}: ${message}`;
    }

    writeToFile(level, message, source = '') {
        try {
            const logFile = path.join(this.logsDir, this.getLogFileName());
            const formatted = this.formatMessage(level, message, source) + '\n';
            fs.appendFileSync(logFile, formatted);
        } catch (error) {
            console.error('Failed to write log to file:', error);
        }
    }

    setLevel(level) {
        const levelKey = level.toUpperCase();
        if (this.levels[levelKey] !== undefined) {
            this.currentLevel = this.levels[levelKey];
            this.info(`Log level set to: ${levelKey}`);
        }
    }

    error(message, source = '') {
        if (this.currentLevel >= this.levels.ERROR) {
            const formatted = this.colors.ERROR(this.formatMessage('ERROR', message, source));
            console.error(formatted);
            this.writeToFile('ERROR', message, source);
        }
    }

    warn(message, source = '') {
        if (this.currentLevel >= this.levels.WARN) {
            const formatted = this.colors.WARN(this.formatMessage('WARN', message, source));
            console.warn(formatted);
            this.writeToFile('WARN', message, source);
        }
    }

    info(message, source = '') {
        if (this.currentLevel >= this.levels.INFO) {
            const formatted = this.colors.INFO(this.formatMessage('INFO', message, source));
            console.log(formatted);
            this.writeToFile('INFO', message, source);
        }
    }

    debug(message, source = '') {
        if (this.currentLevel >= this.levels.DEBUG) {
            const formatted = this.colors.DEBUG(this.formatMessage('DEBUG', message, source));
            console.log(formatted);
            this.writeToFile('DEBUG', message, source);
        }
    }

    success(message, source = '') {
        const formatted = this.colors.SUCCESS(`[${new Date().toLocaleTimeString()}] ✅ ${source ? `[${source}] ` : ''}${message}`);
        console.log(formatted);
        this.writeToFile('SUCCESS', message, source);
    }

    bot(number, message) {
        const formatted = this.colors.TIME(`[${new Date().toLocaleTimeString()}] 🤖 [${number}] ${message}`);
        console.log(formatted);
        this.writeToFile('BOT', message, number);
    }

    command(user, command, args = '') {
        const formatted = chalk.cyan(`[${new Date().toLocaleTimeString()}] 🎮 [${user}] ${command} ${args}`);
        console.log(formatted);
        this.writeToFile('COMMAND', `${command} ${args}`, user);
    }

    database(message) {
        const formatted = chalk.magenta(`[${new Date().toLocaleTimeString()}] 🗄️ ${message}`);
        console.log(formatted);
        this.writeToFile('DATABASE', message);
    }

    telegram(message) {
        const formatted = chalk.blue(`[${new Date().toLocaleTimeString()}] 📱 ${message}`);
        console.log(formatted);
        this.writeToFile('TELEGRAM', message);
    }

    group(event, groupId, details = '') {
        const formatted = chalk.green(`[${new Date().toLocaleTimeString()}] 👥 [${groupId}] ${event} ${details}`);
        console.log(formatted);
        this.writeToFile('GROUP', `${event} ${details}`, groupId);
    }

    message(direction, from, to, type) {
        const arrow = direction === 'in' ? '📥' : '📤';
        const formatted = chalk.yellow(`[${new Date().toLocaleTimeString()}] ${arrow} ${from} → ${to} [${type}]`);
        console.log(formatted);
        this.writeToFile('MESSAGE', `${direction} ${from} → ${to}`, type);
    }

    getLogStats() {
        try {
            const files = fs.readdirSync(this.logsDir);
            const stats = {
                totalFiles: files.length,
                totalSize: 0,
                files: []
            };

            for (const file of files) {
                const filePath = path.join(this.logsDir, file);
                const fileStat = fs.statSync(filePath);
                stats.totalSize += fileStat.size;
                stats.files.push({
                    name: file,
                    size: fileStat.size,
                    modified: fileStat.mtime
                });
            }

            stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    clearOldLogs(days = 7) {
        try {
            const files = fs.readdirSync(this.logsDir);
            const now = Date.now();
            const cutoff = days * 24 * 60 * 60 * 1000;
            let deleted = 0;

            for (const file of files) {
                const filePath = path.join(this.logsDir, file);
                const fileStat = fs.statSync(filePath);
                
                if (now - fileStat.mtimeMs > cutoff) {
                    fs.unlinkSync(filePath);
                    deleted++;
                }
            }

            return { deleted, total: files.length };
        } catch (error) {
            return { error: error.message };
        }
    }
}

module.exports = new Logger();