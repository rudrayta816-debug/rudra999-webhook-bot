const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// =====================
// TELEGRAM DETAILS
// =====================
// Railway deploy ke baad Environment Variables me ye set karna:
// BOT_TOKEN = your telegram bot token
// CHAT_ID = 8510857689
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

        const signal = String(req.body.signal || "").toUpperCase();
        const pair = req.body.pair || "XAUUSD";
        const entry = Number(req.body.entry);

        if (!signal || !entry || isNaN(entry)) {
            return res.status(400).json({
                status: "error",
                message: "Missing signal or entry",
                received: req.body
            });
        }

        const sl = signal === "BUY" ? entry - SL_DOLLARS : entry + SL_DOLLARS;
        const tp = signal === "BUY" ? entry + TP_DOLLARS : entry - TP_DOLLARS;

        const message =
`🚀 NEW TRADE

${signal} ${pair}

Entry: ${entry.toFixed(2)}
SL: ${sl.toFixed(2)}
TP: ${tp.toFixed(2)}`;

        console.log(message);
        await sendTelegram(message);

        res.json({
            status: "ok",
            signal,
            pair,
            entry,
            sl,
            tp
        });

    } catch (err) {
        console.log("❌ Webhook Error:", err.message);
        res.status(500).json({ status: "error", message: err.message });
    }
});

// Health check
app.get("/", (req, res) => {
    res.send("RUDRA__999 WEBHOOK BOT WORKING ✅");
});

// Railway dynamic PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Rudra__999 Webhook Bot running on port ${PORT}`);
});
