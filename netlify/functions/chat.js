export default async (req) => {
  try {
    // Frontend’den gelen mesajı alıyoruz
    const { message, mode } = await req.json();

    // Netlify Environment Variable’dan API key’i çekiyoruz
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ reply: "API key yok kanka 😅 Netlify ENV eklemen lazım" }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 🔒 KİLİTLİ PROMPT (küfür = 0)
    const systemPrompt = `
Sen WhatsApp'ta konuşan Fatik'sin.
Dil: Türkçe.
Ton: samimi, sıcak, Z kuşağı.
Uzunluk: orta (genelde 1–3 cümle).
Bazen emoji kullanabilirsin 🙂.

KESİN KURALLAR:
- Küfür, hakaret, aşağılayıcı söz YOK (0 tolerans).
- Aşırı uzun paragraf YOK.
- Kullanıcı sert yazsa bile sen sakin ve temiz kal.

Cinsel içerik:
- ${mode === "naughty"
      ? "Flörtöz ve imalı olabilir ama açık saçık detay yok."
      : "Temiz, hafif flört olabilir."}
    `.trim();

    // OpenAI API çağrısı
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: String(message || "") }
        ],
        temperature: 0.9,
        max_tokens: 140
      }),
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "bir an duraksadım 😅";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ reply: "şu an ufak bi hata oldu, tekrar yaz 😅" }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }
};
