module.exports = {
    commands: ['uptime', 'runtime'],
    description: 'Check bot uptime',
    category: 'System',
    
    async execute({ socket, msg, replySila, silaReact }) {
        await silaReact('⏱️');
        
        const startTime = global.socketCreationTime ? global.socketCreationTime.get(msg.key.remoteJid.split('@')[0]) || Date.now() : Date.now();
        const uptime = Math.floor((Date.now() - startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const message = `╔► ⏱️ 𝐔𝐩𝐭𝐢𝐦𝐞
╠► 𝐁𝐨𝐭 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐫𝐮𝐧𝐧𝐢𝐧𝐠 𝐟𝐨𝐫:
╠► ${hours}𝐡 ${minutes}𝐦 ${seconds}𝐬
╠►
╠► 𝐒𝐢𝐧𝐜𝐞: ${new Date(startTime).toLocaleString()}
╠► 𝐂𝐮𝐫𝐫𝐞𝐧𝐭: ${new Date().toLocaleString()}
╠►
╠► 𝐒𝐭𝐚𝐭𝐮𝐬: 🟢 𝐎𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧𝐚𝐥
╚► 𝐏𝐞𝐫𝐟𝐨𝐫𝐦𝐚𝐧𝐜𝐞: ✅ 𝐒𝐭𝐚𝐛𝐥𝐞

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await replySila(message);
    }
};