const { exec } = require("child_process");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

function resolveBinary(winName, unixName) {
    const local = path.join(__dirname, "..", "bin", winName);
    if (process.platform === "win32" && fs.existsSync(local)) {
        return local;
    }
    return unixName;
}

const YTDLP = resolveBinary("yt-dlp.exe", "yt-dlp");

module.exports = {
    name: "yt",
    description: "Download YouTube video",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text:
                    "❌ Usage:\n" +
                    ".yt <link | search> [quality]\n" +
                    "Examples:\n" +
                    ".yt cats\n" +
                    ".yt cats 480\n" +
                    ".yt https://youtu.be/... 1080"
            });
        }

        let quality = 720;

        if (/^\d{3,4}$/.test(args[args.length - 1])) {
            quality = parseInt(args.pop());
        }

        let query = args.join(" ");
        let url = query;
        let title = "YouTube video";

        // Search if not a link
        if (!query.includes("youtube.com") && !query.includes("youtu.be")) {
            const search = await yts(query);
            if (!search.videos.length) {
                return sock.sendMessage(jid, { text: "❌ No results found." });
            }

            const video = search.videos[0];
            url = video.url;
            title = video.title;
        }
        // Direct link → fetch title
        else {
            const info = await yts(url);
            if (info?.videos?.length) {
                title = info.videos[0].title;
            }
        }

        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const filePath = path.join(tempDir, "video.mp4");
        const formatSelector = `bv*[height<=${quality}]+ba/b`;

        await sock.sendMessage(jid, {
            text: "🎥 Searching and downloading..."
        });

        await new Promise(resolve => {
            exec(
                `"${YTDLP}" -f "${formatSelector}" --merge-output-format mp4 -o "${filePath}" "${url}"`,
                { windowsHide: true },
                () => resolve()
            );
        });

        if (!fs.existsSync(filePath)) {
            return sock.sendMessage(jid, {
                text: "❌ Download failed."
            });
        }

        const sizeMB = fs.statSync(filePath).size / 1024 / 1024;
        const caption = `🎬 ${title}\n📺 ${quality}p`;

        if (sizeMB <= 15) {
            await sock.sendMessage(jid, {
                video: fs.readFileSync(filePath),
                caption
            });
        } else {
            await sock.sendMessage(jid, {
                document: fs.readFileSync(filePath),
                mimetype: "video/mp4",
                fileName: `youtube-${quality}p.mp4`,
                caption
            });
        }

        fs.unlinkSync(filePath);
    }
};
