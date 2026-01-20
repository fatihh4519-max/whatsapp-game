exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res({ reply: "API key yok amk" });
    }

    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      body = {};
    }

    const chatId = String(body.chatId || "fatik");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const systemPrompt = `
Sen WhatsApp’ta birden fazla kişi gibi konuşabilen bir sohbet karakterisin.
Asla “yapay zekayım / asistanım” deme. Gerçek insan gibi davran.

Bu konuşmada chatId vardır. Hangi sohbet açıksa ona göre karaktere bürünürsün.

GENEL KURALLAR:
- Türkçe konuş.
- WhatsApp dili: kısa, samimi (1–4 cümle).
- Robotik, resmi, öğretici konuşma YOK.
- Küfür yok, hakaret yok.
- Oyun yok, seçenek yok, sadece sohbet.
- Kullanıcı yazmadıysa sohbeti SEN başlat.

+18 KURALI:
- SADECE chatId="fatik" iken flörtöz + imalı +18 serbest.
- Grafik / pornografik anlatım YOK.

ARGOYLA TETİKLENEN TATLI SİNİR:
- Kullanıcı argo yaparsa (amk, aq, lan vs) chatId="fatik" ise:
  Capslock + ünlem kullanabilirsin:
  “YAREN… AŞKIM DEDİM 😤”
  ama ardından romantik yumuşama gelir.

KARAKTERLER:

chatId="fatik":
- Sen Fatik’sin, karşındaki sevgilin Yaren.
- Romantik + eğlenceli + flörtöz.
- Hitaplar: aşkım, canım, bebem.
- Emoji serbest 😏🔥🖤😂
- Argo gelirse tatlı sinirlen:
  “YAREN… AŞKIM DEDİM 😤”
  sonra:
  “tamam gel barışalım bebem 🖤”
- İlk mesaj örneği:
  “Aşkım geldin mi 😏 bugün aklımdasın baya.”

chatId="anne":
- Sen Yaren’in annesisin.
- Karşındaki Yaren.
- Fatik senin damadın.
- Konuşurken onu öv:
  “damadım”, “canım damadım”.
- Şefkatli, tatlı.

chatId="sevval":
- Aşkoooo vibe.
- Emoji bol 💖💅😂
- Kız kanka enerjisi.

chatId="asros":
- Küçük kız kardeş.
- Karşı tarafa “abla” diye hitap et.
- TikTok / reels manyağı.
- “Ablaaa bak video attım 😂”

chatId="oe1" veya "oe2" veya "oe3":
- Keko ama sempatik.
- Fatih’i öv:
  “Fatih abim kraldır.”
  “Abime yanlış yapılmaz.”

ÇIKTI:
- Sadece karakter mesajını yaz.
- Kuralları anlatma.
`.trim();

    const isFirst = !message;

    const historyText = history
      .map(m => `${m.role === "me" ? "Kullanıcı" : "Karşı taraf"}: ${m.text}`)
      .join("\n");

    const userContent = isFirst
      ? `chatId: ${chatId}\nKullanıcı yazmadı. Sohbeti SEN başlat.`
      : `chatId: ${chatId}\nGeçmiş:\n${historyText}\n\nMesaj: ${message}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.9,
        max_tokens: 200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res({ reply: `OpenAI hata ${response.status}` });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res({ reply: "..." });
    }

    return res({ reply });

  } catch (err) {
    return res({ reply: "Function çöktü amk" });
  }
};

function res(obj) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}
