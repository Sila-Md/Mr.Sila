module.exports = {
    commands: ['alive', 'bot', 'sila'],
    description: 'Check if bot is alive',
    category: 'System',
    
    async execute({ socket, msg, replySila, silaReact }) {
        await silaReact('☺️');
        
        const message = `╔► 🐢 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 🐢
╠► 𝐒𝐭𝐚𝐭𝐮𝐬: 🟢 𝐎𝐧𝐥𝐢𝐧𝐞
╠► 𝐕𝐞𝐫𝐬𝐢𝐨𝐧: 2.0.0
╠► 𝐎𝐰𝐧𝐞𝐫: +255612491554
╚► 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦: 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐌𝐮𝐥𝐭𝐢-𝐃𝐞𝐯𝐢𝐜𝐞

╔► 📡 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐒𝐭𝐚𝐭𝐮𝐬:
╠► 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: ✅ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝
╠► 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: ${global.telegramBot ? '✅ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝' : '❌ 𝐃𝐢𝐬𝐚𝐛𝐥𝐞𝐝'}
╠► 𝐃𝐚𝐭𝐚𝐛𝐚𝐬𝐞: ✅ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐞𝐝
╚► 𝐒𝐞𝐫𝐯𝐞𝐫: ✅ 𝐎𝐩𝐞𝐫𝐚𝐭𝐢𝐨𝐧𝐚𝐥

╔► 🔗 𝐉𝐨𝐢𝐧 𝐎𝐮𝐫 𝐂𝐨𝐦𝐦𝐮𝐧𝐢𝐭𝐲:
╠► 𝐂𝐡𝐚𝐧𝐧𝐞𝐥: https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02
╠► 𝐆𝐫𝐨𝐮𝐩: https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks
╚► 𝐓𝐞𝐥𝐞𝐠𝐫𝐚𝐦: http://t.me/Sila_mini_bot

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
        
        await replySila(message);
    }
};