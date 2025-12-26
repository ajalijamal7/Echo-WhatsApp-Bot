const puppeteer = require("puppeteer-core");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

function isTermux() {
    return (
        process.platform === "android" ||
        process.env.PREFIX?.includes("com.termux")
    );
}

function browshScreenshot(url) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const out = path.join(tempDir, "ss-fallback.png");

        execFile(
            "browsh",
            ["--screenshot", out, url],
            { timeout: 30000 },
            (err) => {
                if (err) return reject(err);
                resolve(fs.readFileSync(out));
            }
        );
    });
}

module.exports = {
    name: "ss",
    description: "Screenshot a website",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;
        const url = args[0];

        if (!url) {
            return sock.sendMessage(jid, {
                text: "❌ Usage: .ss <url>"
            });
        }

        await sock.sendMessage(jid, {
            text: "📸 Taking screenshot..."
        });

        let browser;

        try {

            browser = await puppeteer.launch({
                executablePath: isTermux()
                    ? "/data/data/com.termux/files/usr/bin/chromium-browser"
                    : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-gpu",
                    "--no-zygote",
                    "--single-process"
                ],
                headless: "new"
            });

            const page = await browser.newPage();
            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 30000
            });

            const buffer = await page.screenshot({ fullPage: true });
            await browser.close();

            return sock.sendMessage(jid, {
                image: buffer,
                caption: "🖼 Screenshot (Chromium)"
            });

        } catch (puppeteerErr) {
            if (browser) {
                try { await browser.close(); } catch { }
            }

            try {
                const buffer = await browshScreenshot(url);

                return sock.sendMessage(jid, {
                    image: buffer,
                    caption: "🖼 Screenshot (fallback)"
                });

            } catch (fallbackErr) {

                const errorMsg =
                    `❌ *Screenshot failed*\n\n` +
                    `🌐 URL: ${url}\n` +
                    `🖥 Platform: ${isTermux() ? "Termux" : os.platform()}\n\n` +
                    `🧨 Puppeteer error:\n` +
                    "```" +
                    (puppeteerErr.stack || puppeteerErr.message).slice(0, 1500) +
                    "```\n\n" +
                    `🧨 Browsh error:\n` +
                    "```" +
                    (fallbackErr.stack || fallbackErr.message).slice(0, 1500) +
                    "```";

                return sock.sendMessage(jid, { text: errorMsg });
            }
        }
    }
};
