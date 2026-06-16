const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID || "8510857689";

const SL_DOLLARS = Number(process.env.SL_DOLLARS || 5);
const TP_DOLLARS = Number(process.env.TP_DOLLARS || 15);

async function sendTelegram(message) {
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message
        });
        console.log("✅ Telegram Sent");
    } catch (err) {
        console.log("❌ Telegram Error:", err.response?.data || err.message);
    }
}

app.post("/webhook", async (req, res) => {
    try {
        console.log("📩 Body:", req.body);

        const type = String(req.body.type || "ENTRY").toUpperCase();
        const pair = req.body.pair || "XAUUSD";

        if (type === "EXIT") {
            const reason = req.body.reason || "Strategy Exit";

            await sendTelegram(
`🚪 EXIT ${pair}

Reason: ${reason}`
            );

            return res.json({ ok: true, type: "EXIT" });
        }

        if (type === "BREAKEVEN") {
            await sendTelegram(
`🔒 BREAKEVEN HIT

${pair}

SL moved to Entry`
            );

            return res.json({ ok: true, type: "BREAKEVEN" });
        }

        if (type === "TRAILING") {
            const sl = req.body.sl || "Updated";

            await sendTelegram(
`📈 TRAILING STOP UPDATED

${pair}

New SL: ${sl}`
            );

            return res.json({ ok: true, type: "TRAILING" });
        }

        const signal = String(req.body.signal || "").toUpperCase();
        const entry = Number(req.body.entry);

        if (!signal || !entry || isNaN(entry)) {
            return res.status(400).json({
                ok: false,
                error: "Bad data",
                received: req.body
            });
        }

        const sl = signal === "BUY" ? entry - SL_DOLLARS : entry + SL_DOLLARS;
        const tp = signal === "BUY" ? entry + TP_DOLLARS : entry - TP_DOLLARS;

        await sendTelegram(
`🚀 NEW TRADE

${signal} ${pair}

Entry: ${entry.toFixed(2)}
SL: ${sl.toFixed(2)}
TP: ${tp.toFixed(2)}`
        );

        res.json({ ok: true, type: "ENTRY" });

    } catch (err) {
        console.log("❌ Webhook Error:", err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("RUDRA__999 WEBHOOK BOT WORKING ✅");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Rudra__999 Webhook Bot running on port ${PORT}`);
});
