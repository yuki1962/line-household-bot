const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// 環境変数からAPIキーを取得
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/webhook", async (req, res) => {
  const event = req.body.events?.[0];
  if (event?.message?.type === "text") {
    try {
      const userText = event.message.text;

      // Groq API にリクエスト
      const groqResp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: "あなたは親切なアシスタントです。全て日本語で答えてください。" },
            { role: "user", content: userText },
          ],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const replyText = groqResp.data.choices?.[0]?.message?.content || "返答がありません";

      // LINEに返信
      await axios.post(
        "https://api.line.me/v2/bot/message/reply",
        {
          replyToken: event.replyToken,
          messages: [{ type: "text", text: replyText }],
        },
        {
          headers: {
            Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error) {
      console.error("エラー:", error.response?.data || error.message);
    }
  }
  res.sendStatus(200);
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));