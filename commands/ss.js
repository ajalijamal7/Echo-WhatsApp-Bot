const puppeteer = require("puppeteer-core");

module.exports = {
    name: "ss",
    description: "Screenshot a website",

    run: async ({ sock, msg, args }) => {
        const jid = msg.key.remoteJid;
        const url = args[0];

        if (!url) {
            return sock.sendMessage(jid, { text: "❌ Usage: .ss <url>" });
        }

        await sock.sendMessage(jid, { text: "📸 Taking screenshot..." });

        const browser = await puppeteer.launch({
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

        const buffer = await page.screenshot({ fullPage: true });

        await browser.close();

        await sock.sendMessage(jid, {
            image: buffer,
            caption: `🖼 Screenshot of ${url}`
        });
    }
};
