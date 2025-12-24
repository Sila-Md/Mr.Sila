const os = require('os');

module.exports = {
    commands: ['menu', 'help', 'cmd'],
    description: 'Show all available commands',
    category: 'System',
    
    async execute({ socket, msg, replySila, silaReact, botImg, PREFIX }) {
        await silaReact('📜');
        
        const startTime = global.socketCreationTime ? global.socketCreationTime.get(msg.key.remoteJid.split('@')[0]) || Date.now() : Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(2);
        const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(2);
        
        const message = `╭─━━━━━━━━━━━━━━━━━━━━─╮
│ 🐢 𝗦𝗜𝗟𝗔 𝗠𝗗   
│ ✦ Hello User 👋  
│ ✦ Welcome to the command menu
╰─━━━━━━━━━━━━━━━━━━━━─╯

┌───〔 📊 𝗦𝘆𝘀𝘁𝗲𝗺 𝗜𝗻𝗳𝗼 〕───┐
│• Version: 2.0.0
│• Prefix: ${PREFIX}
│• Total RAM: ${totalMemMB} MB
│• Free RAM: ${freeMemMB} MB
│• Uptime: ${hours}h ${minutes}m ${seconds}s
│• OS: ${os.type()}
│• Platform: ${os.platform()}
│• CPU Arch: ${os.arch()}
└────────────────────────┘

╭───《 ⚙️ 𝗕𝗼𝘁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 》───╮
│• alive ☺️
│• ping ⚡
│• video 🎥
│• song 🎵
│• menu 📜
│• chid 🆔
│• freebot 🆓
│• setemoji 🐢
│• settings ⚙️
│• imagine 🎨
│• pair 🔐
│• play 🎧
│• sora 🎬
│• textmaker 🎭
│• tts 🔊
│• fb 📹
│• openai 🧠
│• ai 🤖
│• deepseek 👾
│• vv 👁️
│• apk 📱
│• ig 📸
│• tiktok 🎶
│• url 🔗
│• repo 📦
│• update 🔄
│• uptime ⏱️
│• restart ♻️
│• owner 👑
│• bot on/off 🔛
│• broadcast 📢
│• sticker ✂️
│• joke 😂
│• trt 🔤
╰─────────────────────────╯

╭───《 👥 𝗚𝗿𝗼𝘂𝗽 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 》───╮
│• mute 🔇
│• unmute 🔊
│• delete 🗑️
│• kick 👢
│• tag 🏷️
│• tagall 📢
│• hidetag 🙈
│• kickall 🚫
│• getpic 📸
│• link 🔗
│• join ➕
│• add 👥
│• ginfo ℹ️
│• senddm 📨
│• listonline 👤
│• poll 📊
│• chatbot 💬
│• setgpp 🖼️
│• setgname 📝
│• setgdesc 📋
│• antitag ⚠️
│• warn ⚠️
│• clear 🧹
│• antilink 🔗
│• antimention 📢
│• ban 🚫
╰─────────────────────────╯

📢 Join our official channels & groups!
🎅 Merry Christmas from SILA MD! 🎄

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

        await socket.sendMessage(msg.key.remoteJid, { 
            image: { url: botImg }, 
            caption: message 
        }, { quoted: msg });
    }
};