const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =====================
// TELEGRAM DETAILS
// =====================
const BOT_TOKEN = process.env.BOT_TOKEN || "8490506099:AAHWUbLx4nnBMA6qxVPN5hLSSYkoyYkjOy8";
const CHAT_ID = process.env.CHAT_ID || "8510857689";

// =====================
// SETTINGS
// =====================
const SL_DOLLARS = Number(process.env.SL_DOLLARS || 5);
const TP_DOLLARS = Number(process.env.TP_DOLLARS || 15);

// =====================
// TELEGRAM SEND
// =====================
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

// =====================
// WEBHOOK RECEIVE
// =====================
app.post("/webhook", async (req, res) => {
    try {
        console.log("📩 Webhook Body:", req.body);

        const type = String(req.body.type || "ENTRY").toUpperCase();

        // =====================
        // EXIT MESSAGE
        // =====================
        if (type === "EXIT") {
            const pair = req.body.pair || "XAUUSD";
            const reason = req.body.reason || "Strategy Exit";

            const exitMessage =
`🚪 EXIT ${pair}

Reason: ${reason}`;

            console.log(exitMessage);
            await sendTelegram(exitMessage);

            return res.json({
                ok: true,
                type: "EXIT",
                pair,
                reason
            });
        }

        // =====================
        // ENTRY MESSAGE
        // =====================
        const signal = String(req.body.signal || "").toUpperCase();
        const pair = req.body.pair || "XAUUSD";
        const entry = Number(req.body.entry);

        if (!signal || !entry || isNaN(entry)) {
            console.log("❌ Bad data received:", req.body);
            return res.status(400).json({
                status: "error",
                message: "Missing signal or entry",
                received: req.body
            });
        }

        const sl = signal === "BUY"
            ? entry - SL_DOLLARS
            : entry + SL_DOLLARS;

        const tp = signal === "BUY"
            ? entry + TP_DOLLARS
            : entry - TP_DOLLARS;

        const entryMessage =
`🚀 NEW TRADE

${signal} ${pair}

Entry: ${entry.toFixed(2)}
SL: ${sl.toFixed(2)}
TP: ${tp.toFixed(2)}`;

        console.log(entryMessage);
        await sendTelegram(entryMessage);

        return res.json({
            ok: true,
            type: "ENTRY",
            signal,
            pair,
            entry,
            sl,
            tp
        });

    } catch (err) {
        console.log("❌ Webhook Error:", err.message);
        return res.status(500).json({
            status: "error",
            message: err.message
        });
    }
});

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
    res.send("RUDRA__999 WEBHOOK BOT WORKING ✅");
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Rudra__999 Webhook Bot running on port ${PORT}`);
});
