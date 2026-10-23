const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const AI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const AI_BASE_URL = process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname)));

app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Servidor da Info31 funcionando." });
});

app.post("/api/chat", async (req, res) => {
  const mensagem = (req.body?.mensagem || "").trim();

  if (!mensagem) {
    return res.status(400).json({ resposta: "Escreva uma mensagem antes de enviar." });
  }

  if (!AI_API_KEY) {
    return res.status(500).json({
      resposta: "Configure a chave do OpenRouter no arquivo .env: OPENROUTER_API_KEY=sua_chave"
    });
  }

  try {
    const respostaApi = await fetch(AI_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Info31"
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        temperature: 0.8,
        systemInstruction: [
          {
            role: "system",
            content: "Você é a Info31, uma assistente emocional acolhedora e cuidadosa. Responda em português do Brasil, com empatia, sem diagnóstico, sem substituir profissionais. Responda de forma breve, clara e acolhedora."
          },
          { role: "user", content: mensagem }
        ]
      })
    });

    if (!respostaApi.ok) {
      const erroTexto = await respostaApi.text();
      throw new Error(`OpenRouter respondeu com erro: ${respostaApi.status} - ${erroTexto}`);
    }

    const dados = await respostaApi.json();
    const textoResposta = dados.choices?.[0]?.message?.content?.trim() || "Não consegui responder agora.";

    res.json({ resposta: textoResposta });
  } catch (error) {
    console.error("Erro ao chamar a IA:", error);
    res.status(500).json({
      resposta: "Não consegui responder no momento. Verifique sua chave gratuita do OpenRouter e tente novamente."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor da Info31 rodando em http://localhost:${PORT}`);
});