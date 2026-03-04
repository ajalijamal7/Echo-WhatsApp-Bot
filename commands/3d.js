const fs = require("fs");
const path = require("path");
const config = require("../config");

const API_KEY = config.aimlApiKey;

module.exports = {
    name: "3d",
    description: "Generate 3D model from text",
    ownerOnly: false,
    groupOnly: false,

    async run({ sock, msg, args }) {
        const from = msg.key.remoteJid;
        const prompt = args.join(" ");

        if (!prompt) {
            return sock.sendMessage(from, {
                text: "Usage:\n.3d futuristic robot"
            });
        }

        const tempGLB = path.join(__dirname, `model_${Date.now()}.glb`);
        const tempPreview = path.join(__dirname, `preview_${Date.now()}.png`);

        try {
            await sock.sendMessage(from, {
                text: "⏳ Generating 3D model..."
            });

            const response = await fetch("https://api.aimlapi.com/v1/generate-3d", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    prompt: prompt
                })
            });

            const data = await response.json();

            const modelUrl =
                data?.model_url ||
                data?.result?.model_url ||
                data?.file_url;

            const previewUrl =
                data?.preview_url ||
                data?.result?.preview_url ||
                data?.image_url;

            if (!modelUrl) {
                console.log("API RESPONSE:", data);
                throw new Error("No model URL returned from API");
            }

            // Download preview
            if (previewUrl) {
                const imgRes = await fetch(previewUrl);
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

                fs.writeFileSync(tempPreview, imgBuffer);

                await sock.sendMessage(from, {
                    image: imgBuffer,
                    caption: "🖼 3D Model Preview"
                });
            }

            // Download model
            const modelRes = await fetch(modelUrl);
            const modelBuffer = Buffer.from(await modelRes.arrayBuffer());

            fs.writeFileSync(tempGLB, modelBuffer);

            await sock.sendMessage(from, {
                document: modelBuffer,
                mimetype: "model/gltf-binary",
                fileName: "generated_model.glb"
            });

        } catch (err) {
            console.error("3D ERROR:", err);

            await sock.sendMessage(from, {
                text: "❌ Failed to generate 3D model."
            });

        } finally {
            if (fs.existsSync(tempGLB)) fs.unlinkSync(tempGLB);
            if (fs.existsSync(tempPreview)) fs.unlinkSync(tempPreview);
        }
    }
};