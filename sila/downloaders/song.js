const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    commands: ['song', 'play', 'mp3', 'audio', 'music'],
    description: 'Download audio from YouTube',
    category: 'Downloaders',
    
    async execute({ socket, msg, args, replySila, silaReact }) {
        await silaReact('🎵');
        
        try {
            const q = args.join(" ");
            if (!q) {
                return await replySila(`╔► 𝐄𝐫𝐫𝐨𝐫: 📝\n╠► 𝐃𝐨 𝐲𝐨𝐮 𝐰𝐚𝐧𝐭 𝐭𝐨 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐚𝐧𝐲 𝐚𝐮𝐝𝐢𝐨? 🥺\n╠► 𝐓𝐡𝐞𝐧 𝐰𝐫𝐢𝐭𝐞 𝐥𝐢𝐤𝐞 𝐭𝐡𝐢𝐬 ☺️\n╠►\n╠► .play <𝐲𝐨𝐮𝐫 𝐚𝐮𝐝𝐢𝐨 𝐧𝐚𝐦𝐞>\n╠►\n╠► 𝐖𝐫𝐢𝐭𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐩𝐥𝐚𝐲 𝐚𝐧𝐝 𝐭𝐡𝐞𝐧 𝐲𝐨𝐮𝐫 𝐚𝐮𝐝𝐢𝐨 𝐧𝐚𝐦𝐞 ☺️\n╚► 𝐓𝐡𝐞𝐧 𝐭𝐡𝐚𝐭 𝐚𝐮𝐝𝐢𝐨 𝐰𝐢𝐥𝐥 𝐛𝐞 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐚𝐧𝐝 𝐬𝐞𝐧𝐭 𝐡𝐞𝐫𝐞 🥰💞\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`);
            }

            // Try different APIs
            let apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(q)}`;
            try {
                const res = await axios.get(apiUrl);
                const data = res.data;

                if (data?.success && data?.result?.downloadUrl) {
                    const meta = data.result.metadata;
                    const dlUrl = data.result.downloadUrl;
                    
                    const caption = `╔► 🐢 𝐀𝐔𝐃𝐈𝐎 𝐈𝐍𝐅𝐎 🐢
╠► 𝐍𝐀𝐌𝐄: ${meta.title}
╠► 𝐂𝐇𝐀𝐍𝐍𝐄𝐋: ${meta.channel}
╠► 𝐓𝐈𝐌𝐄: ${meta.duration}
╚► 𝐒𝐈𝐙𝐄: ${meta.size || 'Unknown'}

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;
                    
                    // Try to get thumbnail
                    try {
                        const thumbRes = await axios.get(meta.cover, { responseType: 'arraybuffer' });
                        const buffer = Buffer.from(thumbRes.data, 'binary');
                        await socket.sendMessage(msg.key.remoteJid, { image: buffer, caption }, { quoted: msg });
                    } catch {
                        await socket.sendMessage(msg.key.remoteJid, { text: caption }, { quoted: msg });
                    }
                    
                    await socket.sendMessage(msg.key.remoteJid, {
                        audio: { url: dlUrl },
                        mimetype: "audio/mpeg",
                        fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                    }, { quoted: msg });
                    return;
                }
            } catch { }

            // Fallback to original method
            const search = await yts(q);
            if (!search.videos.length) {
                return await replySila("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐍𝐨 𝐫𝐞𝐬𝐮𝐥𝐭𝐬 𝐟𝐨𝐮𝐧𝐝\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡");
            }
            const ytUrl = search.videos[0].url;
            
            const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3&apikey=sadiya`;
            const { data: apiRes } = await axios.get(api);

            if (!apiRes?.status || !apiRes.result?.download) {
                return await replySila("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐒𝐨𝐦𝐞𝐭𝐡𝐢𝐧𝐠 𝐰𝐞𝐧𝐭 𝐰𝐫𝐨𝐧𝐠\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡");
            }

            const result = apiRes.result;
            const caption = `╔► 🎵 𝐀𝐔𝐃𝐈𝐎 𝐈𝐍𝐅𝐎
╠► 𝐓𝐢𝐭𝐥𝐞: ${result.title}
╠► 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧: ${result.duration}
╠► 𝐕𝐢𝐞𝐰𝐬: ${result.views}
╚► 𝐑𝐞𝐥𝐞𝐚𝐬𝐞𝐝: ${result.publish}

> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`;

            await socket.sendMessage(msg.key.remoteJid, { image: { url: result.thumbnail }, caption: caption }, { quoted: msg });
            await socket.sendMessage(msg.key.remoteJid, { audio: { url: result.download }, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
        } catch (e) {
            await replySila("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐒𝐨𝐦𝐞𝐭𝐡𝐢𝐧𝐠 𝐰𝐞𝐧𝐭 𝐰𝐫𝐨𝐧𝐠\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡");
        }
    }
};