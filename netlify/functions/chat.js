exports.handler = async (event) => {
  try {
    // Netlify Node 18+ genelde fetch destekler.
    if (typeof fetch !== "function") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: "fetch yok gibi görünüyor (runtime eski olabilir) 😵" }),
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: "OPENAI_API_KEY bulunamadı (Netlify ENV) 😅" }),
      };
    }

    // GET ile açarsan body olmaz; o yüzden sağlam parse
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      body = {};
    }

    const message = (body.message || "").toString().trim() || "selam";
    const mode = body.mode === "naughty" ? "naughty" : "normal";

    const systemPrompt = `
Sen WhatsApp'ta konuşan Fatik'sin.
Dil: Türkçe. Ton: samimi, şakacı, kısa-orta (1-3 cümle).
Kesin kurallar: Küfür yok, hakaret yok.
Cinsel içerik: ${mode === "naughty" ? "imalı/flörtöz olabilir ama açık saçık detay yok." : "temiz, hafif flört olabilir."}
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
        temperature: 0.85,
        max_tokens: 160,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    // OpenAI hata döndürdüyse, bunu reply içine bas ki sen de gör
    if (!resp.ok) {
      const errMsg =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data).slice(0, 200);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: `OpenAI hata: ${resp.status} - ${errMsg}`,
        }),
      };
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Bir an afalladım 😅";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    // Hatanın kendisini reply içine basıyoruz ki saklanmasın
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: `Function crash: ${String(err?.message || err)}`,
      }),
    };
  }
};
