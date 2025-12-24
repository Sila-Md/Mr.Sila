const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const axios = require('axios');

class Utils {
    constructor() {
        this.tempDir = './temp';
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // Format time
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // Format bytes to readable size
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Get system info
    getSystemInfo() {
        return {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: this.formatBytes(os.totalmem()),
            freeMemory: this.formatBytes(os.freemem()),
            usedMemory: this.formatBytes(os.totalmem() - os.freemem()),
            uptime: this.formatTime(os.uptime() * 1000),
            hostname: os.hostname(),
            networkInterfaces: os.networkInterfaces()
        };
    }

    // Download file
    async downloadFile(url, filename = null) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });

            if (!filename) {
                filename = path.basename(url.split('?')[0]) || `download_${Date.now()}`;
            }

            const filePath = path.join(this.tempDir, filename);
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    // Generate random string
    randomString(length = 10) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Generate unique ID
    generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    }

    // Validate phone number
    validatePhoneNumber(phone) {
        const cleaned = phone.replace(/[^0-9]/g, '');
        return cleaned.length >= 10 && cleaned.length <= 15;
    }

    // Format phone number
    formatPhoneNumber(phone, countryCode = '255') {
        let cleaned = phone.replace(/[^0-9]/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = countryCode + cleaned.substring(1);
        } else if (!cleaned.startsWith(countryCode)) {
            cleaned = countryCode + cleaned;
        }
        
        return cleaned;
    }

    // Check if string is a URL
    isUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Extract URL from text
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    // Parse command arguments
    parseArgs(text) {
        const args = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            args.push(current);
        }
        
        return args;
    }

    // Delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Clean temporary files
    async cleanTempFiles(maxAge = 3600000) { // 1 hour default
        try {
            const files = await fs.readdir(this.tempDir);
            const now = Date.now();
            let deleted = 0;
            
            for (const file of files) {
                const filePath = path.join(this.tempDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    await fs.unlink(filePath);
                    deleted++;
                }
            }
            
            return { deleted, total: files.length };
        } catch (error) {
            return { error: error.message };
        }
    }

    // Create directory if not exists
    ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            return true;
        }
        return false;
    }

    // Read JSON file with fallback
    readJsonFile(filePath, defaultValue = {}) {
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(content);
            }
            return defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    // Write JSON file
    writeJsonFile(filePath, data) {
        try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    }

    // Get file extension
    getFileExtension(filename) {
        return path.extname(filename).toLowerCase().replace('.', '');
    }

    // Check if file is image
    isImageFile(filename) {
        const ext = this.getFileExtension(filename);
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    }

    // Check if file is video
    isVideoFile(filename) {
        const ext = this.getFileExtension(filename);
        return ['mp4', 'avi', 'mov', 'mkv', 'flv', 'webm'].includes(ext);
    }

    // Check if file is audio
    isAudioFile(filename) {
        const ext = this.getFileExtension(filename);
        return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext);
    }
}

module.exports = new Utils();