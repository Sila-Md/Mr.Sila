const axios = require('axios');

module.exports = {
    commands: ['pair'],
    description: 'Get pairing code for WhatsApp',
    category: 'Tools',
    
    async execute({ socket, msg, args, replySila, silaReact }) {
        await silaReact('🔐');
        
        try {
            const phoneNumber = args.join(" ").trim();
            if (!phoneNumber) {
                return await replySila(`╔► 🐢 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 🐢
╠► 𝐅𝐎𝐑 𝐘𝐎𝐔𝐑 𝐍𝐔𝐌𝐁𝐄𝐑 ☺️
╠►
╠► 𝐖𝐑𝐈𝐓𝐄 𝐋𝐈𝐊𝐄 𝐓𝐇𝐈𝐒 😇
╠►
╠► .pair +255612491554
╠►
╠► 𝐈𝐍𝐒𝐓𝐄𝐀𝐃 𝐎𝐅 𝐓𝐇𝐈𝐒 𝐍𝐔𝐌𝐁𝐄𝐑 𝐖𝐑𝐈𝐓𝐄 𝐘𝐎𝐔𝐑 𝐍𝐔𝐌𝐁𝐄𝐑 𝐎𝐊 😊
╠► 𝐓𝐇𝐄𝐍 𝐘𝐎𝐔 𝐖𝐈𝐋𝐋 𝐆𝐄𝐓 𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐂𝐎𝐃𝐄 😃
╠► 𝐘𝐎𝐔 𝐂𝐀𝐍 𝐋𝐎𝐆𝐈𝐍 𝐖𝐈𝐓𝐇 𝐓𝐇𝐀𝐓 𝐏𝐀𝐈𝐑𝐈𝐍𝐆 𝐂𝐎𝐃𝐄 𝐈𝐍 𝐘𝐎𝐔𝐑 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 😌
╚► 𝐓𝐇𝐄𝐍 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 𝐖𝐈𝐋𝐋 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄 𝐎𝐍 𝐘𝐎𝐔𝐑 𝐍𝐔𝐌𝐁𝐄𝐑 😍
\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`);
            }

            if (!phoneNumber.match(/^\+?\d{10,15}$/)) {
                return await replySila(`╔► 🐢 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 🐢
╠► 𝐃𝐎 𝐘𝐎𝐔 𝐖𝐀𝐍𝐓 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 𝐏𝐀𝐈𝐑 𝐂𝐎𝐃𝐄? 🤔
╠►
╠► 𝐓𝐇𝐄𝐍 𝐖𝐑𝐈𝐓𝐄 𝐋𝐈𝐊𝐄 𝐓𝐇𝐈𝐒 ☺️
╠►
╠► .pair +255612491554
╠►
╠► 𝐖𝐇𝐄𝐍 𝐘𝐎𝐔 𝐖𝐑𝐈𝐓𝐄 𝐋𝐈𝐊𝐄 𝐓𝐇𝐈𝐒 😇
╠► 𝐓𝐇𝐄𝐍 𝐘𝐎𝐔 𝐖𝐈𝐋𝐋 𝐆𝐄𝐓 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 𝐏𝐀𝐈𝐑 𝐂𝐎𝐃𝐄 😃
╠► 𝐘𝐎𝐔 𝐂𝐀𝐍 𝐋𝐎𝐆𝐈𝐍 𝐈𝐍 𝐘𝐎𝐔𝐑 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏 😍
╚► 𝐘𝐎𝐔𝐑 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 𝐖𝐈𝐋𝐋 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄 🥰
\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`);
            }

            const HEROKU_APP_URL = process.env.APP_URL || 'https://mr-sila-tech.onrender.com';
            const baseUrl = `${HEROKU_APP_URL}/code?number=`;
            const response = await axios.get(`${baseUrl}${encodeURIComponent(phoneNumber)}`);

            if (!response.data || !response.data.code) {
                return await replySila("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐏𝐥𝐞𝐚𝐬𝐞 𝐭𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐚𝐟𝐭𝐞𝐫 𝐬𝐨𝐦𝐞 𝐭𝐢𝐦𝐞 🥺❤️\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡");
            }

            const pairingCode = response.data.code;
            await socket.sendMessage(msg.key.remoteJid, { 
                text: `╔► 🐢 𝐒𝐈𝐋𝐀 𝐌𝐃 𝐌𝐈𝐍𝐈 𝐁𝐎𝐓 🐢\n╠► 𝐏𝐀𝐈𝐑 𝐂𝐎𝐃𝐄: ${pairingCode}\n╠►\n╠► 𝐄𝐧𝐭𝐞𝐫 𝐭𝐡𝐢𝐬 𝐜𝐨𝐝𝐞 𝐢𝐧 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐭𝐨 𝐜𝐨𝐧𝐧𝐞𝐜𝐭 𝐲𝐨𝐮𝐫 𝐛𝐨𝐭! 🚀\n╚► 𝐂𝐨𝐝𝐞 𝐞𝐱𝐩𝐢𝐫𝐞𝐬 𝐢𝐧 5 𝐦𝐢𝐧𝐮𝐭𝐞𝐬\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡` 
            }, { quoted: msg });
            
            await socket.sendMessage(msg.key.remoteJid, { 
                text: pairingCode 
            }, { quoted: msg });
        } catch (error) {
            await replySila("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐏𝐚𝐢𝐫 𝐜𝐨𝐝𝐞 𝐢𝐬 𝐧𝐨𝐭 𝐜𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐧𝐠 𝐭𝐨 𝐲𝐨𝐮𝐫 𝐧𝐮𝐦𝐛𝐞𝐫 ☹️\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡");
        }
    }

};
