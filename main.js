const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const yts = require('yt-search');
const googleTTS = require("google-tts-api");
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

// Load commands from sila folder
const commandLoader = require('./sila/loader.js');
const { loadCommands, getCommand } = commandLoader;

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kaviduinduwara:kavidu2008@cluster0.bqmspdf.mongodb.net/soloBot?retryWrites=true&w=majority&appName=Cluster0';

// Telegram Bot Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8526421940:AAFU39FEU61U3ORKIe8NuqzBACydzqcOgSI';
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID || '7303596375';
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Sila_mini_bot';

// Initialize Telegram Bot
let telegramBot = null;
if (TELEGRAM_TOKEN) {
    telegramBot = new Telegraf(TELEGRAM_TOKEN);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
}).then(() => {
    console.log('╔► ✅ Connected to MongoDB');
    console.log('╚► → Database: soloBot');
}).catch(err => {
    console.error('╔► ❌ MongoDB connection error:');
    console.error('╚► →', err.message);
    process.exit(1);
});

// MongoDB Schemas
const sessionSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    sessionId: { type: String },
    settings: { type: Object, default: {} },
    creds: { type: Object },
    telegramId: { type: String },
    pairingCode: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// MongoDB Models
const Session = mongoose.model('Session', sessionSchema);
const Settings = mongoose.model('Settings', settingsSchema);

console.log('╔► ✅ Using MongoDB database system');
console.log('╚► → Models: Session, Settings');

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// Create plugins directory
const PLUGINS_PATH = './plugins';
if (!fs.existsSync(PLUGINS_PATH)) {
    fs.mkdirSync(PLUGINS_PATH, { recursive: true });
}

// Create sila commands directory
const SILA_PATH = './sila';
if (!fs.existsSync(SILA_PATH)) {
    fs.mkdirSync(SILA_PATH, { recursive: true });
    
    // Create subdirectories
    const subDirs = ['downloaders', 'group', 'ai', 'tools', 'system', 'owner'];
    subDirs.forEach(dir => {
        fs.mkdirSync(path.join(SILA_PATH, dir), { recursive: true });
    });
}

// Define combined fakevCard with Christmas and regular version
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© SILA AI 🎅",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SILA AI CHRISTMAS\nORG:SILA AI;\nTEL;type=CELL;type=VOICE;waid=255612491554:+255612491554\nEND:VCARD`
        }
    }
};

const defaultSettings = {
    online: 'off',
    autoread: false,
    autoswview: true,
    autoswlike: true,
    autoreact: false,
    autorecord: true,
    autotype: true,
    worktype: 'public',
    antidelete: 'on',
    autoai: "on",
    autosticker: "off",
    autovoice: "off",
    anticall: false,
    stemoji: "🐢",
    onlyworkgroup_links: {
        whitelist: []
    }
};

// Auto-reply messages
const autoReplies = {
    'hi': '𝙷𝚎𝚕𝚕𝚘! 👋 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?',
    'mambo': '𝙿𝚘𝚊 𝚜𝚊𝚗𝚊! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'hey': '𝙷𝚎𝚢 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'vip': '𝙷𝚎𝚕𝚕𝚘 𝚅𝙸𝙿! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'mkuu': '𝙷𝚎𝚢 𝚖𝚔𝚞𝚞! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'boss': '𝚈𝚎𝚜 𝚋𝚘𝚜𝚜! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞?',
    'habari': '𝙽𝚣𝚞𝚛𝚒 𝚜𝚊𝚗𝚊! 👋 𝙷𝚊𝚋𝚊𝚛𝚒 𝚢𝚊𝚔𝚘?',
    'hello': '𝙷𝚒 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'bot': '𝚈𝚎𝚜, 𝙸 𝚊𝚖 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 s1! 🤖 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'menu': '𝚃𝚢𝚙𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜! 📜',
    'owner': '𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛 𝚞𝚜𝚒𝚗𝚐 .𝚘𝚠𝚗𝚎𝚛 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 👑',
    'thanks': '𝚈𝚘𝚞\'𝚛𝚎 𝚠𝚎𝚕𝚌𝚘𝚖𝚎! 😊',
    'thank you': '𝙰𝚗𝚢𝚝𝚒𝚖𝚎! 𝙻𝚎𝚝 𝚖𝚎 𝚔𝚗𝚘𝚠 𝚒𝚏 𝚢𝚘𝚞 𝚗𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 🤖'
};

// Channels and groups to auto-join
const AUTO_JOIN_LINKS = [
    'https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28', // MAIN
    'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02', // STB
    'https://whatsapp.com/channel/0029VbBmFT430LKO7Ch9C80X', // LOGO
    'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks', // BOT.USER
    'https://chat.whatsapp.com/C03aOCLQeRUH821jWqRPC6' // SILATECH
];

// Channel JIDs for auto-reaction
const CHANNEL_JIDS = [
    '120363422610520277@newsletter',
    '120363402325089913@newsletter'
];

// Bot images for random selection
const BOT_IMAGES = [
    'https://files.catbox.moe/277zt9.jpg',
    'https://files.catbox.moe/277zt9.jpg'
];

const OWNER_NUMBERS = ['255789661031', '255612491554'];

// Telegram Functions
async function sendTelegramMessage(chatId, message) {
    if (!telegramBot) return;
    
    try {
        await telegramBot.telegram.sendMessage(chatId, message);
        return true;
    } catch (error) {
        console.error('Telegram send error:', error.message);
        return false;
    }
}

async function handleTelegramPairing(ctx) {
    try {
        const userId = ctx.from.id;
        const message = ctx.message.text;
        
        if (message.startsWith('/pair')) {
            const number = message.split(' ')[1];
            if (!number || !number.match(/^\+?\d{10,15}$/)) {
                return ctx.reply('*🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙵𝙾𝚁 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 ☺️*\n\n*𝚄𝚂𝙰𝙶𝙴:* /pair +255612491554\n\n*𝙸𝙽𝚂𝚃𝙴𝙰𝙳 𝙾𝙵 𝚃𝙷𝙸𝚂 𝙽𝚄𝙼𝙱𝙴𝚁 𝚆𝚁𝙸𝚃𝙴 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 𝙾𝙺 😊*');
            }
            
            // Generate pairing code
            const HEROKU_APP_URL = process.env.APP_URL || 'https://nachoka.onrender.com';
            const baseUrl = `${HEROKU_APP_URL}/code?number=`;
            const response = await axios.get(`${baseUrl}${encodeURIComponent(number)}`);
            
            if (response.data && response.data.code) {
                const pairingCode = response.data.code;
                
                // Save to database
                await Session.findOneAndUpdate(
                    { telegramId: userId.toString() },
                    { 
                        number: number.replace(/[^0-9]/g, ''),
                        telegramId: userId.toString(),
                        pairingCode: pairingCode,
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );
                
                await ctx.reply(`*🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 🐢*\n\n*𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴: ${pairingCode}*\n\nEnter this code in WhatsApp to connect your bot! 🚀\n\n*𝙽𝚘𝚝𝚎:* This code expires in 5 minutes.`);
                await ctx.reply(pairingCode); // Send code as separate message
            } else {
                await ctx.reply('*𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽 𝙰𝙵𝚃𝙴𝚁 𝚂𝙾𝙼𝙴 𝚃𝙸𝙼𝙴 🥺❤️*');
            }
        }
    } catch (error) {
        console.error('Telegram pairing error:', error);
        await ctx.reply('*𝙰𝙽 𝙴𝚁𝚁𝙾𝚁 𝙾𝙲𝙲𝚄𝚁𝚁𝙴𝙳. 𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽.*');
    }
}

// Start Telegram Bot
if (telegramBot) {
    telegramBot.start((ctx) => {
        ctx.reply(`*🐢 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 𝚃𝙾 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙱𝙾𝚃 🐢*\n\n*𝙱𝚘𝚝 𝚄𝚜𝚎𝚛𝚗𝚊𝚖𝚎:* @${TELEGRAM_BOT_USERNAME}\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜:*\n/pair <number> - Get WhatsApp pairing code\n/help - Show help menu\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝙱𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`);
    });
    
    telegramBot.command('pair', handleTelegramPairing);
    telegramBot.command('help', (ctx) => {
        ctx.reply(`*🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙱𝙾𝚃 𝙷𝙴𝙻𝙿 🐢*\n\n*𝙲𝚘𝚖𝚖𝚊𝚗𝚍𝚜:*\n/pair +255612491554 - Get WhatsApp pairing code\n\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎:*\n/pair +255612491554\n\n*𝙽𝚘𝚝𝚎:* Replace +255612491554 with your WhatsApp number\n\n*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝙱𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`);
    });
    
    telegramBot.launch().then(() => {
        console.log('╔► ✅ Telegram Bot Started');
        console.log(`╚► → Username: @${TELEGRAM_BOT_USERNAME}`);
    }).catch(err => {
        console.error('╔► ❌ Telegram Bot Error:');
        console.error('╚► →', err.message);
    });
}

// MongoDB CRUD operations for Session model
Session.findOneAndUpdate = async function(query, update, options = {}) {
    try {
        const session = await this.findOne(query);
        
        if (session) {
            // Handle $set operator
            if (update.$set) {
                Object.assign(session, update.$set);
            } else {
                Object.assign(session, update);
            }
            session.updatedAt = new Date();
            await session.save();
            return session;
        } else if (options.upsert) {
            const newSession = new this({
                ...query,
                ...update.$set,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await newSession.save();
            return newSession;
        }
        return null;
    } catch (error) {
        console.error('Error in findOneAndUpdate:', error);
        return null;
    }
};

// MongoDB CRUD operations for Settings model
Settings.findOneAndUpdate = async function(query, update, options = {}) {
    try {
        const settings = await this.findOne(query);
        
        if (settings) {
            // Handle $set operator
            if (update.$set) {
                Object.assign(settings.settings, update.$set);
            } else {
                Object.assign(settings.settings, update);
            }
            settings.updatedAt = new Date();
            await settings.save();
            return settings;
        } else if (options.upsert) {
            const newSettings = new this({
                ...query,
                settings: update.$set || update,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await newSettings.save();
            return newSettings;
        }
        return null;
    } catch (error) {
        console.error('Error in Settings findOneAndUpdate:', error);
        return null;
    }
};

// Helper function to get settings
async function getSettings(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

        if (!settingsDoc) {
            settingsDoc = await Settings.findOneAndUpdate(
                { number: sanitizedNumber },
                { $set: defaultSettings },
                { upsert: true, new: true }
            );
            return defaultSettings;
        }

        const mergedSettings = { ...defaultSettings };
        for (let key in settingsDoc.settings) {
            if (
                typeof settingsDoc.settings[key] === 'object' &&
                !Array.isArray(settingsDoc.settings[key]) &&
                settingsDoc.settings[key] !== null
            ) {
                mergedSettings[key] = {
                    ...defaultSettings[key],
                    ...settingsDoc.settings[key]
                };
            } else {
                mergedSettings[key] = settingsDoc.settings[key];
            }
        }

        const needsUpdate = JSON.stringify(settingsDoc.settings) !== JSON.stringify(mergedSettings);

        if (needsUpdate) {
            await Settings.findOneAndUpdate(
                { number: sanitizedNumber },
                { $set: { settings: mergedSettings } },
                { upsert: true }
            );
        }

        return mergedSettings;
    } catch (error) {
        console.error('Error in getSettings:', error);
        return defaultSettings;
    }
}

// Helper function to update settings
async function updateSettings(number, updates = {}) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

        if (!settingsDoc) {
            settingsDoc = await Settings.findOneAndUpdate(
                { number: sanitizedNumber },
                { $set: { ...defaultSettings, ...updates } },
                { upsert: true, new: true }
            );
            return settingsDoc.settings;
        }

        const mergedSettings = { ...defaultSettings };

        // Merge existing settings
        for (const key in settingsDoc.settings) {
            if (
                typeof settingsDoc.settings[key] === 'object' &&
                !Array.isArray(settingsDoc.settings[key]) &&
                settingsDoc.settings[key] !== null
            ) {
                mergedSettings[key] = {
                    ...defaultSettings[key],
                    ...settingsDoc.settings[key],
                };
            } else {
                mergedSettings[key] = settingsDoc.settings[key];
            }
        }

        // Apply updates
        for (const key in updates) {
            if (
                typeof updates[key] === 'object' &&
                !Array.isArray(updates[key]) &&
                updates[key] !== null
            ) {
                mergedSettings[key] = {
                    ...mergedSettings[key],
                    ...updates[key],
                };
            } else {
                mergedSettings[key] = updates[key];
            }
        }

        settingsDoc.settings = mergedSettings;
        settingsDoc.updatedAt = new Date();
        await settingsDoc.save();

        return mergedSettings;
    } catch (error) {
        console.error('Error in updateSettings:', error);
        return defaultSettings;
    }
}

// Helper function to save settings
async function saveSettings(number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

        if (!settingsDoc) {
            settingsDoc = new Settings({
                number: sanitizedNumber,
                settings: defaultSettings
            });
            await settingsDoc.save();
            return defaultSettings;
        }

        const settings = settingsDoc.settings;
        let updated = false;

        for (const key in defaultSettings) {
            if (!(key in settings)) {
                settings[key] = defaultSettings[key];
                updated = true;
            } else if (
                typeof defaultSettings[key] === 'object' &&
                defaultSettings[key] !== null &&
                !Array.isArray(defaultSettings[key])
            ) {
                for (const subKey in defaultSettings[key]) {
                    if (!(subKey in settings[key])) {
                        settings[key][subKey] = defaultSettings[key][subKey];
                        updated = true;
                    }
                }
            }
        }

        if (updated) {
            settingsDoc.settings = settings;
            settingsDoc.updatedAt = new Date();
            await settingsDoc.save();
        }

        return settings;
    } catch (error) {
        console.error('Error in saveSettings:', error);
        return defaultSettings;
    }
}

function isBotOwner(jid, number, socket) {
    try {
        const cleanNumber = (number || '').replace(/\D/g, '');
        const cleanJid = (jid || '').replace(/\D/g, '');
        const bot = jidDecode(socket.user.id).user;

        if (bot === number) return true;
        
        return OWNER_NUMBERS.some(owner => cleanNumber.endsWith(owner) || cleanJid.endsWith(owner));
    } catch (err) {
        return false;
    }
}

function getQuotedText(quotedMessage) {
    if (!quotedMessage) return '';

    if (quotedMessage.conversation) return quotedMessage.conversation;
    if (quotedMessage.extendedTextMessage?.text) return quotedMessage.extendedTextMessage.text;
    if (quotedMessage.imageMessage?.caption) return quotedMessage.imageMessage.caption;
    if (quotedMessage.videoMessage?.caption) return quotedMessage.videoMessage.caption;
    if (quotedMessage.buttonsMessage?.contentText) return quotedMessage.buttonsMessage.contentText;
    if (quotedMessage.listMessage?.description) return quotedMessage.listMessage.description;
    if (quotedMessage.listMessage?.title) return quotedMessage.listMessage.title;
    if (quotedMessage.listResponseMessage?.singleSelectReply?.selectedRowId) return quotedMessage.listResponseMessage.singleSelectReply.selectedRowId;
    if (quotedMessage.templateButtonReplyMessage?.selectedId) return quotedMessage.templateButtonReplyMessage.selectedId;
    if (quotedMessage.reactionMessage?.text) return quotedMessage.reactionMessage.text;

    if (quotedMessage.viewOnceMessage) {
        const inner = quotedMessage.viewOnceMessage.message;
        if (inner?.imageMessage?.caption) return inner.imageMessage.caption;
        if (inner?.videoMessage?.caption) return inner.videoMessage.caption;
        if (inner?.imageMessage) return '[view once image]';
        if (inner?.videoMessage) return '[view once video]';
    }

    if (quotedMessage.stickerMessage) return '[sticker]';
    if (quotedMessage.audioMessage) return '[audio]';
    if (quotedMessage.documentMessage?.fileName) return quotedMessage.documentMessage.fileName;
    if (quotedMessage.contactMessage?.displayName) return quotedMessage.contactMessage.displayName;

    return '';
}

// Auto Bio Function
async function setupAutoBio(socket) {
    setInterval(async () => {
        try {
            const bios = [
                "🐢 SILA-MD-MINI | By SILA",
                "🤖 WhatsApp Bot | SILA TECH",
                "🚀 Powerful Features | SILA MD",
                "💫 Always Online | SILA BOT",
                "🎯 Fast & Reliable | SILA-MINI"
            ];
            const randomBio = bios[Math.floor(Math.random() * bios.length)];
            await socket.updateProfileStatus(randomBio);
        } catch (error) {
            // Silent error handling
        }
    }, 30000); // Change bio every 30 seconds
}

// Auto Join Channels/Groups - FIXED VERSION
async function autoJoinChannels(socket) {
    try {
        console.log('╔► 🔄 Starting auto-join channels...');
        
        for (const link of AUTO_JOIN_LINKS) {
            try {
                console.log(`╠► Processing: ${link}`);
                
                if (link.includes('whatsapp.com/channel/')) {
                    const channelId = link.split('/channel/')[1];
                    console.log(`╠► Joining channel: ${channelId}`);
                    
                    // Try newsletter follow
                    try {
                        await socket.newsletterFollow(channelId);
                        console.log(`╠► ✅ Successfully followed channel: ${channelId}`);
                    } catch (channelError) {
                        // Check if already followed
                        if (channelError.message && channelError.message.includes('already')) {
                            console.log(`╠► ℹ️ Already following channel: ${channelId}`);
                        } else {
                            console.log(`╠► ⚠️ Channel join failed: ${channelError.message}`);
                        }
                    }
                    
                } else if (link.includes('chat.whatsapp.com/')) {
                    const groupCode = link.split('chat.whatsapp.com/')[1];
                    console.log(`╠► Joining group: ${groupCode}`);
                    
                    // Try group invite
                    try {
                        await socket.groupAcceptInvite(groupCode);
                        console.log(`╠► ✅ Successfully joined group: ${groupCode}`);
                    } catch (groupError) {
                        // Check if already in group
                        if (groupError.message && groupError.message.includes('already')) {
                            console.log(`╠► ℹ️ Already in group: ${groupCode}`);
                        } else {
                            console.log(`╠► ⚠️ Group join failed: ${groupError.message}`);
                        }
                    }
                }
                
                await delay(3000); // Wait 3 seconds between joins
                
            } catch (error) {
                console.log(`╠► ❌ Error joining ${link}:`, error.message);
            }
        }
        
        console.log('╚► ✅ Auto-join process completed');
    } catch (error) {
        console.error('╔► ❌ Auto-join error:');
        console.error('╚► →', error.message);
    }
}

// Auto Reaction for Channels - FIXED VERSION
async function setupChannelAutoReaction(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || !msg.key.remoteJid) return;

            const remoteJid = msg.key.remoteJid;
            
            // Check if message is from a channel we want to auto-react to
            if (CHANNEL_JIDS.includes(remoteJid)) {
                try {
                    const emojis = ['🐢', '❤️', '🔥', '⭐', '💫', '🚀'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    
                    await socket.sendMessage(remoteJid, { 
                        react: { 
                            text: randomEmoji, 
                            key: msg.key 
                        }
                    });
                    
                    console.log(`╔► ✅ Auto-reacted to channel message`);
                    console.log(`╚► → Channel: ${remoteJid}, Emoji: ${randomEmoji}`);
                } catch (reactError) {
                    console.log(`╔► ⚠️ Auto-react failed:`);
                    console.log(`╚► → ${reactError.message}`);
                }
            }
        } catch (error) {
            // Silent error handling
        }
    });
}

// Load Plugins
function loadPlugins() {
    const plugins = {};
    try {
        if (!fs.existsSync(PLUGINS_PATH)) {
            return plugins; // Return empty if plugins folder doesn't exist
        }
        
        const pluginFiles = fs.readdirSync(PLUGINS_PATH).filter(file => file.endsWith('.js'));
        
        for (const file of pluginFiles) {
            try {
                const pluginPath = path.join(PLUGINS_PATH, file);
                const plugin = require(pluginPath);
                plugins[path.basename(file, '.js')] = plugin;
            } catch (error) {
                console.log(`Error loading plugin ${file}:`, error.message);
            }
        }
    } catch (error) {
        // Silent error - continue without plugins
    }
    
    return plugins;
}

// Utility function for formatted messages
function silaMessage(text) {
    const randomImage = BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)];
    
    return {
        text: text,
        contextInfo: {
            externalAdReply: {
                title: 'SILA AI',
                body: 'WhatsApp ‧ Verified',
                thumbnailUrl: randomImage,
                thumbnailWidth: 64,
                thumbnailHeight: 64,
                sourceUrl: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
                mediaUrl: randomImage,
                showAdAttribution: true,
                renderLargerThumbnail: false,
                previewType: 'PHOTO',
                mediaType: 1
            },
            forwardedNewsletterMessageInfo: {
                newsletterJid: CHANNEL_JIDS[0],
                newsletterName: 'SILA AI OFFICIAL',
                serverMessageId: Math.floor(Math.random() * 1000000)
            },
            isForwarded: true,
            forwardingScore: 999
        }
    };
}

// Status Handler - FIXED VERSION
async function silaStatushandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg || !msg.message) return;

            const sender = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            const settings = await getSettings(number);
            const isStatus = sender === 'status@broadcast';
            if (!settings) return;

            if (isStatus) {
                // Auto view status
                if (settings.autoswview === true || settings.autoswview === "on") {
                    try {
                        await socket.readMessages([msg.key]);
                        console.log(`╔► 👁️ Auto-viewed status from: ${msg.key.participant || 'unknown'}`);
                    } catch (viewError) {
                        console.log(`╔► ⚠️ Auto-view failed:`);
                        console.log(`╚► → ${viewError.message}`);
                    }
                }

                // Auto like status
                if (settings.autoswlike === true || settings.autoswlike === "on") {
                    try {
                        const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'];
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                        
                        await socket.sendMessage(msg.key.remoteJid, { 
                            react: { 
                                key: msg.key, 
                                text: randomEmoji 
                            } 
                        });
                        
                        console.log(`╔► 👍 Auto-liked status with: ${randomEmoji}`);
                        console.log(`╚► → From: ${msg.key.participant || 'unknown'}`);
                    } catch (likeError) {
                        console.log(`╔► ⚠️ Auto-like failed:`);
                        console.log(`╚► → ${likeError.message}`);
                    }
                }
            }

            if (!isStatus) {
                // Auto read messages
                if (settings.autoread) {
                    try {
                        await socket.readMessages([msg.key]);
                    } catch (readError) {
                        console.log(`Auto-read failed: ${readError.message}`);
                    }
                }

                // Online presence
                if (settings.online === true || settings.online === "on") {
                    try {
                        await socket.sendPresenceUpdate("available", sender);
                    } catch (presenceError) {
                        console.log(`Presence update failed: ${presenceError.message}`);
                    }
                } else {
                    try {
                        await socket.sendPresenceUpdate("unavailable", sender);
                    } catch (presenceError) {
                        console.log(`Presence update failed: ${presenceError.message}`);
                    }
                }
            }
        } catch (error) {
            console.error('Status handler error:', error);
        }
    });
}

// Group event handler
const groupEvents = {
    handleGroupUpdate: async (socket, update) => {
        try {
            if (!update || !update.id || !update.participants) return;
            
            const participants = update.participants;
            const metadata = await socket.groupMetadata(update.id);
            
            for (const num of participants) {
                const userName = num.split("@")[0];
                
                if (update.action === "add") {
                    const welcomeText = `╭━━【 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 】━━━━━━━━╮\n` +
                                     `│ 👋 @${userName}\n` +
                                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                    
                    await socket.sendMessage(update.id, {
                        text: welcomeText,
                        mentions: [num]
                    }, { quoted: fakevCard });
                    
                } else if (update.action === "remove") {
                    const goodbyeText = `╭━━【 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 】━━━━━━━━╮\n` +
                                     `│ 👋 @${userName}\n` +
                                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                    
                    await socket.sendMessage(update.id, {
                        text: goodbyeText,
                        mentions: [num]
                    }, { quoted: fakevCard });
                    
                } else if (update.action === "promote") {
                    const promoter = update.author?.split("@")[0] || "System";
                    const promoteText = `╭━━【 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                                     `│ ⬆️ @${userName}\n` +
                                     `│ 👑 By: @${promoter}\n` +
                                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                    
                    const mentions = update.author ? [update.author, num] : [num];
                    await socket.sendMessage(update.id, {
                        text: promoteText,
                        mentions: mentions
                    }, { quoted: fakevCard });
                    
                } else if (update.action === "demote") {
                    const demoter = update.author?.split("@")[0] || "System";
                    const demoteText = `╭━━【 𝐃𝐄𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                                    `│ ⬇️ @${userName}\n` +
                                    `│ 👑 By: @${demoter}\n` +
                                    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                    `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                    
                    const mentions = update.author ? [update.author, num] : [num];
                    await socket.sendMessage(update.id, {
                        text: demoteText,
                        mentions: mentions
                    }, { quoted: fakevCard });
                }
            }
        } catch (err) {
            console.error('Group event error:', err);
        }
    }
};

// Command handler using sila folder commands
async function silaMessageHandler(socket, number) {
    // Load all commands from sila folder
    const commands = loadCommands();
    
    socket.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const msg = messages[0];
            if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

            const setting = await getSettings(number);
            const remoteJid = msg.key.remoteJid;
            const jidNumber = remoteJid.split('@')[0];
            const isGroup = remoteJid.endsWith('@g.us');
            const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
            const owners = [];
            const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

            // Handle auto-replies for inbox messages
            if (!isGroup && !isOwner && setting.worktype === 'inbox') {
                const lowerText = text.toLowerCase().trim();
                if (autoReplies[lowerText]) {
                    await socket.sendMessage(remoteJid, { text: autoReplies[lowerText] });
                    return;
                }
            }

            if (owners.includes(jidNumber) || isOwner) {} else {
                switch (setting.worktype) {
                    case 'private':
                        if (jidNumber !== number) return;
                        break;

                    case 'group':
                        if (!isGroup) return;
                        break;

                    case 'inbox':
                        if (isGroup || jidNumber === number) return;
                        break;

                    case 'public': default:
                        break;
                }
            }

            let command = null;
            let args = [];
            let sender = msg.key.remoteJid;
            let PREFIX = ".";
            let botImg = BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)];
            let devTeam = "";
            let botcap = "";
            let boterr = "╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐐𝐮𝐢𝐜𝐤 𝐩𝐢𝐧𝐠 𝐟𝐚𝐢𝐥𝐞𝐝\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡";
            let botNumber = await socket.decodeJid(socket.user.id);
            let body = msgContent.trim();
            let isCommand = body.startsWith(PREFIX);

            if (isCommand) {
                const parts = body.slice(PREFIX.length).trim().split(/ +/);
                command = parts.shift().toLowerCase();
                args = parts;
            }

            // Helper functions
            const ownerMessage = async () => {
                await socket.sendMessage(sender, {text: `╔► 𝐄𝐫𝐫𝐨𝐫: 🚫\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐜𝐚𝐧 𝐨𝐧𝐥𝐲 𝐛𝐞 𝐮𝐬𝐞𝐝 𝐛𝐲 𝐭𝐡𝐞 𝐨𝐰𝐧𝐞𝐫\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`}, { quoted: msg });
            };

            const groupMessage = async () => {
                await socket.sendMessage(sender, {text: `╔► 𝐄𝐫𝐫𝐨𝐫: 🚫\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐢𝐬 𝐨𝐧𝐥𝐲 𝐟𝐨𝐫 𝐩𝐫𝐢𝐯𝐚𝐭𝐞 𝐜𝐡𝐚𝐭 𝐮𝐬𝐞\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`}, { quoted: msg });
            };

            const replySila = async (text) => {
                await socket.sendMessage(sender, silaMessage(text), { quoted: msg });
            };

            const silaReact = async (emoji) => {
                await socket.sendMessage(sender, { react: { text: emoji, key: msg.key }}, { quoted: msg });
            };

            // Execute command from sila folder
            if (command && commands[command]) {
                try {
                    const cmd = commands[command];
                    await cmd.execute({
                        socket,
                        msg,
                        command,
                        args,
                        sender,
                        number,
                        isOwner,
                        setting,
                        replySila,
                        silaReact,
                        botImg,
                        PREFIX,
                        isGroup,
                        ownerMessage,
                        groupMessage
                    });
                } catch (error) {
                    console.error(`Command ${command} error:`, error);
                    await replySila(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐞𝐱𝐞𝐜𝐮𝐭𝐢𝐨𝐧 𝐟𝐚𝐢𝐥𝐞𝐝\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`);
                }
                return;
            }

            // Handle group events
            if (msg.message?.groupInviteMessage) {
                await groupEvents.handleGroupUpdate(socket, {
                    id: sender,
                    participants: [msg.key.participant || socket.user.id],
                    action: "add"
                });
            }

        } catch (error) {
            console.error("Message handler error:", error);
        }
    });
}

async function sessionDownload(sessionId, number, retries = 3) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    const credsFilePath = path.join(sessionPath, 'creds.json');

    // For MongoDB sessions
    if (sessionId.includes('MONGO-')) {
        try {
            const sessionDoc = await Session.findOne({ number: sanitizedNumber });
            
            if (sessionDoc && sessionDoc.creds) {
                await fs.ensureDir(sessionPath);
                await fs.writeFile(credsFilePath, JSON.stringify(sessionDoc.creds, null, 2));
                return { success: true, path: credsFilePath };
            } else {
                return { success: false, error: 'MongoDB session not found' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // For local sessions
    if (sessionId.includes('SESSION-LOCAL-')) {
        if (fs.existsSync(credsFilePath)) {
            return { success: true, path: credsFilePath };
        } else {
            return { success: false, error: 'Local session file not found' };
        }
    }

    return { success: false, error: 'Invalid session ID format' };
}

async function uploadCredsToMongoDB(credsPath, number) {
    try {
        const sanitizedNumber = number.replace(/[^0-9]/g, '');
        const credsContent = await fs.readFile(credsPath, 'utf8');
        const creds = JSON.parse(credsContent);
        
        await Session.findOneAndUpdate(
            { number: sanitizedNumber },
            { 
                creds: creds,
                updatedAt: new Date()
            },
            { upsert: true }
        );
        
        return `MONGO-${sanitizedNumber}-${Date.now()}`;
    } catch (error) {
        console.error('Error saving creds to MongoDB:', error);
        // Fallback to local storage
        return `SESSION-LOCAL-${Date.now()}`;
    }
}

async function silaBot(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    try {
        await saveSettings(sanitizedNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const logger = pino({ level: 'silent' });

        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari'),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            defaultQueryTimeoutMs: 60000
        });

        socket.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                const decoded = jidDecode(jid) || {}
                return (decoded.user && decoded.server) ? decoded.user + '@' + decoded.server : jid
            } else return jid
        }

        socketCreationTime.set(sanitizedNumber, Date.now());

        // Setup all auto features
        await setupAutoBio(socket);
        await autoJoinChannels(socket);
        await setupChannelAutoReaction(socket);
        
        await silaMessageHandler(socket, sanitizedNumber);
        await silaStatushandler(socket, sanitizedNumber);

        let responseStatus = {
            codeSent: false,
            connected: false,
            error: null
        };

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
            } catch (error) {}
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                switch (statusCode) {
                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Bad session detected, clearing session data...`);
                        try {
                            fs.removeSync(sessionPath);
                            await Session.findOneAndDelete({ number: sanitizedNumber });
                            console.log(`[ ${sanitizedNumber} ] Session data cleared successfully`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Bad session detected. Session cleared, please try pairing again.';
                    break;

                    case DisconnectReason.connectionClosed:
                        console.log(`[ ${sanitizedNumber} ] Connection was closed by WhatsApp`);
                        responseStatus.error = 'Connection was closed by WhatsApp. Please try again.';
                    break;

                    case DisconnectReason.connectionLost:
                        console.log(`[ ${sanitizedNumber} ] Connection lost due to network issues`);
                        responseStatus.error = 'Network connection lost. Please check your internet and try again.';
                    break;

                    case DisconnectReason.connectionReplaced:
                        console.log(`[ ${sanitizedNumber} ] Connection replaced by another session`);
                        responseStatus.error = 'Connection replaced by another session. Only one session per number is allowed.';
                    break;

                    case DisconnectReason.loggedOut:
                        console.log(`[ ${sanitizedNumber} ] Logged out from WhatsApp`);
                        try {
                            fs.removeSync(sessionPath);
                            await Session.findOneAndDelete({ number: sanitizedNumber });
                            console.log(`[ ${sanitizedNumber} ] Session data cleared after logout`);
                        } catch (error) {
                            console.log(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Logged out from WhatsApp. Please pair again.';
                    break;

                    case DisconnectReason.restartRequired:
                        console.log(`[ ${sanitizedNumber} ] Restart required by WhatsApp`);
                        responseStatus.error = 'WhatsApp requires restart. Please try connecting again.';

                        activeSockets.delete(sanitizedNumber);
                        socketCreationTime.delete(sanitizedNumber);

                        try {
                            socket.ws?.close();
                        } catch (err) {
                            console.log(`[ ${sanitizedNumber} ] Error closing socket during restart.`);
                        }

                        setTimeout(() => {
                            silaBot(sanitizedNumber, res);
                        }, 2000); 
                    break;

                    case DisconnectReason.timedOut:
                        console.log(`[ ${sanitizedNumber} ] Connection timed out`);
                        responseStatus.error = 'Connection timed out. Please check your internet connection and try again.';
                    break;

                    case DisconnectReason.forbidden:
                        console.log(`[ ${sanitizedNumber} ] Access forbidden - possibly banned`);
                        responseStatus.error = 'Access forbidden. Your number might be temporarily banned from WhatsApp.';
                    break;

                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Invalid session data`);
                        try {
                            fs.removeSync(sessionPath);
                            await Session.findOneAndDelete({ number: sanitizedNumber });
                            console.log(`[ ${sanitizedNumber} ] Invalid session data cleared`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Invalid session data. Session cleared, please pair again.';
                    break;

                    case DisconnectReason.multideviceMismatch:
                        console.log(`[ ${sanitizedNumber} ] Multi-device mismatch`);
                        responseStatus.error = 'Multi-device configuration mismatch. Please try pairing again.';
                    break;

                    case DisconnectReason.unavailable:
                        console.log(`[ ${sanitizedNumber} ] Service unavailable`);
                        responseStatus.error = 'WhatsApp service is temporarily unavailable. Please try again later.';
                    break;

                    default:
                        console.log(`[ ${sanitizedNumber} ] Unknown disconnection reason:`, statusCode);
                        responseStatus.error = shouldReconnect 
                            ? 'Unexpected disconnection. Attempting to reconnect...' 
                            : 'Connection terminated. Please try pairing again.';
                    break;
                }
                
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                if (!res.headersSent && responseStatus.error) {
                    res.status(500).send({ 
                        status: 'error', 
                        message: `[ ${sanitizedNumber} ] ${responseStatus.error}` 
                    });
                }
                
            } else if (connection === 'connecting') {
                console.log(`[ ${sanitizedNumber} ] Connecting...`);
                
            } else if (connection === 'open') {
                console.log(`╔► ✅ [ ${sanitizedNumber} ] Connected successfully!`);
                console.log(`╚► → Time: ${new Date().toLocaleTimeString()}`);

                activeSockets.set(sanitizedNumber, socket);
                responseStatus.connected = true;

                try {
                    const filePath = path.join(sessionPath, 'creds.json');

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found");
                        res.status(500).send({
                            status: 'error',
                            message: "File not found"
                        })
                        return;
                    }

                    const sessionId = await uploadCredsToMongoDB(filePath, sanitizedNumber);
                    const userId = await socket.decodeJid(socket.user.id);
                    await Session.findOneAndUpdate({ number: userId }, { sessionId: sessionId }, { upsert: true, new: true });     
                    
                    // Send connection success message
                    await socket.sendMessage(userId, { 
                        text: `╔► ✅ 𝐁𝐨𝐭 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!\n╠► 𝐓𝐢𝐦𝐞: ${new Date().toLocaleTimeString()}\n╠► 𝐃𝐚𝐭𝐞: ${new Date().toLocaleDateString()}\n╠► 𝐒𝐭𝐚𝐭𝐮𝐬: 🟢 𝐎𝐧𝐥𝐢𝐧𝐞\n╚► 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 2.0.0\n\n╔► 📢 𝐉𝐨𝐢𝐧 𝐨𝐮𝐫 𝐜𝐡𝐚𝐧𝐧𝐞𝐥𝐬 𝐚𝐧𝐝 𝐠𝐫𝐨𝐮𝐩𝐬!\n╠► 𝐂𝐡𝐚𝐧𝐧𝐞𝐥: https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02\n╚► 𝐆𝐫𝐨𝐮𝐩: https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`
                    });

                } catch (e) {
                    console.log('Error saving session:', e.message);
                }
 
                if (!res.headersSent) {
                    res.status(200).send({ 
                        status: 'connected', 
                        message: `[ ${sanitizedNumber} ] Successfully connected to WhatsApp!` 
                    });
                }
            }
        });

        if (!socket.authState.creds.registered) {
            let retries = 3;
            let code = null;
            
            while (retries > 0 && !code) {
                try {
                    await delay(1500);
                    code = await socket.requestPairingCode(sanitizedNumber);
                    
                    if (code) {
                        console.log(`╔► 🔐 [ ${sanitizedNumber} ] Pairing code generated`);
                        console.log(`╚► → Code: ${code}`);
                        responseStatus.codeSent = true;

                        if (!res.headersSent) {
                            res.status(200).send({ 
                                status: 'pairing_code_sent', 
                                code: code,
                                message: `[ ${sanitizedNumber} ] Enter this code in WhatsApp: ${code}` 
                            });
                        }
                        break;
                    }
                } catch (error) {
                    retries--;
                    console.log(`[ ${sanitizedNumber} ] Failed to request, retries left: ${retries}.`);
                    
                    if (retries > 0) {
                        await delay(300 * (4 - retries));
                    }
                }
            }
            
            if (!code && !res.headersSent) {
                res.status(500).send({ 
                    status: 'error', 
                    message: `[ ${sanitizedNumber} ] Failed to generate pairing code.` 
                });
            }
        } else {
            console.log(`[ ${sanitizedNumber} ] Already registered, connecting...`);
        }

        setTimeout(() => {
            if (!responseStatus.connected && !res.headersSent) {
                res.status(408).send({ 
                    status: 'timeout', 
                    message: `[ ${sanitizedNumber} ] Connection timeout. Please try again.` 
                });

                if (activeSockets.has(sanitizedNumber)) {
                    activeSockets.get(sanitizedNumber).ws?.close();
                    activeSockets.delete(sanitizedNumber);
                }

                socketCreationTime.delete(sanitizedNumber);
            }
        }, 60000);

    } catch (error) {
        console.log(`[ ${sanitizedNumber} ] Setup error:`, error.message);
        
        if (!res.headersSent) {
            res.status(500).send({ 
                status: 'error', 
                message: `[ ${sanitizedNumber} ] Failed to initialize connection.` 
            });
        }
    }
}

async function startAllSessions() {
    try {
        const sessions = await Session.find();
        console.log(`╔► 🔄 Found ${sessions.length} sessions to reconnect.`);

        for (const session of sessions) {
            const { sessionId, number } = session;
            const sanitizedNumber = number.replace(/[^0-9]/g, '');

            if (activeSockets.has(sanitizedNumber)) {
                console.log(`╠► [ ${sanitizedNumber} ] Already connected. Skipping...`);
                continue;
            }

            try {
                await sessionDownload(sessionId, sanitizedNumber);
                await silaBot(sanitizedNumber, { headersSent: true, status: () => ({ send: () => {} }) });
                await delay(5000); // Delay between reconnections
            } catch (err) {
                console.log(`╠► ❌ Error reconnecting ${sanitizedNumber}:`, err.message);
            }
        }

        console.log('╚► ✅ Auto-reconnect process completed.');
    } catch (err) {
        console.log('╔► ❌ Auto-reconnect error:');
        console.log('╚► →', err.message);
    }
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Number parameter is required' 
        });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!sanitizedNumber || sanitizedNumber.length < 10) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Invalid phone number format' 
        });
    }

    if (activeSockets.has(sanitizedNumber)) {
        return res.status(200).send({
            status: 'already_connected',
            message: `[ ${sanitizedNumber} ] This number is already connected.`
        });
    }

    await silaBot(number, res);
});

process.on('exit', async () => {
    activeSockets.forEach((socket, number) => {
        try {
            socket.ws?.close();
        } catch (error) {
            console.error(`[ ${number} ] Failed to close connection.`);
        }
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { router, startAllSessions };