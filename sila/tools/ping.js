module.exports = {
    commands: ['ping', 'p'],
    description: 'Check bot response time',
    category: 'Tools',
    
    async execute({ socket, msg, replySila, silaReact }) {
        await silaReact('🏓');
        
        const start = Date.now();
        const pingMsg = await socket.sendMessage(msg.key.remoteJid, { 
            text: '╔► 𝐏𝐢𝐧𝐠𝐢𝐧𝐠... 🏓\n╚► → 𝐏𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭...\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡' 
        }, { quoted: msg });
        
        const latency = Date.now() - start;
        
        // Calculate speed status
        let speedStatus = "";
        let speedEmoji = "";
        if (latency < 200) {
            speedStatus = "𝐄𝐱𝐜𝐞𝐥𝐥𝐞𝐧𝐭";
            speedEmoji = "🚀";
        } else if (latency < 500) {
            speedStatus = "𝐆𝐨𝐨𝐝";
            speedEmoji = "⚡";
        } else if (latency < 1000) {
            speedStatus = "𝐌𝐨𝐝𝐞𝐫𝐚𝐭𝐞";
            speedEmoji = "🐢";
        } else {
            speedStatus = "𝐒𝐥𝐨𝐰";
            speedEmoji = "🐌";
        }
        
        // Get uptime
        const startTime = global.socketCreationTime ? global.socketCreationTime.get(msg.key.remoteJid.split('@')[0]) || Date.now() : Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeText = hours > 0 ? `${hours}𝐡 ${minutes}𝐦 ${seconds}𝐬` : `${minutes}𝐦 ${seconds}𝐬`;
        
        const result = `╔► 𝐏𝐨𝐧𝐠! 🏓
╠► 𝐋𝐚𝐭𝐞𝐧𝐜𝐲: ${latency}𝐦𝐬
╠► 𝐒𝐩𝐞𝐞𝐝: ${speedStatus} ${speedEmoji}
╠► 𝐔𝐩𝐭𝐢𝐦𝐞: ${uptimeText}
╠► 𝐓𝐢𝐦𝐞: ${new Date().toLocaleTimeString()}
╚► 𝐒𝐭𝐚𝐭𝐮𝐬: ✅ 𝐎𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧𝐚𝐥

╔► 𝐏𝐞𝐫𝐟𝐨𝐫𝐦𝐚𝐧𝐜𝐞 𝐋𝐞𝐯𝐞𝐥:
╠► ${latency < 200 ? "🟢 𝐄𝐱𝐜𝐞𝐥𝐥𝐞𝐧𝐭" : latency < 500 ? "🟡 𝐆𝐨𝐨𝐝" : "🔴 𝐒𝐥𝐨𝐰"}
╚► → 𝐑𝐞𝐬𝐩𝐨𝐧𝐬𝐞 𝐭𝐢𝐦𝐞: ${latency}𝐦𝐬

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await socket.sendMessage(msg.key.remoteJid, { 
            text: result, 
            edit: pingMsg.key 
        });
    }
};