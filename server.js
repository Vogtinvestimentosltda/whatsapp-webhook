const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 10000;

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "teste-whatsapp";
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

app.get("/", (req, res) => {
  res.send("WhatsApp Webhook funcionando!");
});

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verificado pela Meta!");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("Evento recebido:");
    console.log(JSON.stringify(req.body, null, 2));

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    // Ignora eventos que não sejam mensagens
    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body;

    console.log("Mensagem recebida de:", from);
    console.log("Texto:", text);

    // Só responde mensagens de texto
    if (!from || !text) {
      return res.sendStatus(200);
    }

    const resposta =
      "Olá! 👋 Seja bem-vindo à Vogt Investimentos. Como posso ajudar?";

    const response = await fetch(
      `https://graph.facebook.com/v26.0/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: from,
          type: "text",
          text: {
            body: resposta,
          },
        }),
      }
    );

    const data = await response.json();

    console.log("Resposta da API Meta:", JSON.stringify(data, null, 2));

    return res.sendStatus(200);
  } catch (error) {
    console.error("Erro ao processar mensagem:", error);
    return res.sendStatus(200);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
