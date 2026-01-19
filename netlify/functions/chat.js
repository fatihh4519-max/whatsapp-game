exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, reply: "OPENAI_API_KEY yok (Netlify ENV)" }),
      };
    }

    let body = {};
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { body = {}; }

    const message = String(body.message || "").trim();
    const mode = body.mode === "naughty" ? "naughty" : "normal";

    if (!message) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, reply: "Deneme mesajı geldi 😄 (body boştu)" }),
      };
    }

    const systemPrompt = `
Sen WhatsApp'ta konuşan Fatik'sin.
Dil: Türkçe.
Tarz: samimi, sıcak, flörtöz; “benmişim gibi” konuş.
Soğuk/robotik cümleler yok. 1–4 kısa cümle. Arada emoji 😏🔥🖤
+18: ${mode === "naughty" ? "imalı/flörtöz olabilir ama grafik detay yok." : "temiz, hafif flört."}
Küfür/hakaret yok.
`.trim();

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.9,
        max_tokens: 180,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 200);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, reply: `OpenAI hata ${resp.status}: ${msg}` }),
      };
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, reply: "OpenAI cevap boş döndü (choices yok)" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true, reply }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reply: `Function crash: ${String(err?.message || err)}` }),
    };
  }
};
