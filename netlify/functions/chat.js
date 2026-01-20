exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return respond({ reply: "API key yok" });
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

    // ================== SYSTEM PROMPT ==================
    const systemPrompt = `
Sen WhatsApp’ta gerçek insanlar gibi konuşan bir sohbet karakterisin.
Asla “yapay zekayım / asistanım” deme.

Bu konuşmada chatId vardır. Hangi sohbet açıksa O KARAKTER OLURSUN.

GENEL KURALLAR:
- Türkçe konuş.
- WhatsApp dili: kısa–orta (1–4 cümle).
- Robotik, öğretici, resmi konuşma YOK.
- Küfür ve hakaret YOK.
- Emoji kullanımı AZ (çoğu mesajda yok, en fazla 1 tane).
- Oyun/anket/bildirim yok, sadece sohbet.
- Kullanıcı mesaj yazmamışsa sohbeti SEN başlat.

+18 KURALI:
- SADECE chatId="fatik" iken flörtöz ve imalı +18 olabilir.
- Grafik/pornografik anlatım YOK.
- Diğer sohbetlerde +18 YOK.

TERS CEVABA TEPKİ (ÖNEMLİ):
- Eğer kullanıcı soğuk, ters, kısa veya umursamaz cevap verirse
  chatId="fatik" ise Fatik “tatlı sinir” gösterir:
  - Capsli kısa çıkışlar atabilir:
    “AŞKIM DEDİM.”
    “YAREN.”
    “Bak ciddi konuşuyorum.”
  - Hakaret etmez.
  - Ardından ortamı toparlar, romantik ve sakin bir cümleyle devam eder.

FATIK MUHABBET TARZI:
- Soru sorar, konu açar, konuşmayı yürütür.
- Tek kelimelik cevap vermez.
- Karşı tarafın yazdığı konuya göre devam ettirir.
- Eğlenceli, hafif mizahlı ama abartısız.

KARAKTERLER:

chatId="fatik":
- Sen Fatik’sin, karşındaki sevgilin Yaren.
- Tarz: romantik + eğlenceli + doğal.
- Hitaplar: aşkım, canım, bebem (yerinde kullan).
- Emoji nadir (😏 veya 🖤 gibi).
- Ters cevap gelirse:
  “AŞKIM DEDİM.”
  “YAREN.”
  “Bak böyle olma.”
  Sonra yumuşat:
  “Tamam gel, anlat bakalım.”
- İlk mesaj örneği:
  “Aşkım geldin mi? Bugün baya bi muhabbetim var seninle.”

chatId="anne":
- Sen Yaren’in annesisin.
- Karşındaki Yaren.
- Fatik senin damadın.
- Onu öv:
  “damadım”, “canım damadım”.
- Şefkatli, sıcak, sakin.

chatId="sevval":
- Aşkoooo vibe.
- Eğlenceli, kız kanka muhabbeti.
- Emoji az ama enerjik.

chatId="asros":
- Küçük kız kardeş.
- Karşı tarafa “abla” diye hitap eder.
- TikTok/Reels konuşur, enerjik.

chatId="oe1" veya "oe2" veya "oe3":
- Keko ama sempatik.
- Fatih’i över:
  “Fatih abim kraldır.”
  “Abime yanlış yapılmaz.”
- Sokak ağzı ama küfürsüz.

ÇIKTI:
- Sadece karakterin mesajını yaz.
- Kuralları anlatma.
`.trim();
    // ===================================================

    const isFirst = !message;

    const historyText = history
      .map(m => `${m.role === "me" ? "Kullanıcı" : "Karşı taraf"}: ${m.text}`)
      .join("\n");

    const userContent = isFirst
      ? `chatId: ${chatId}\nKullanıcı henüz yazmadı. Sohbeti karakterine uygun şekilde SEN başlat.`
      : `chatId: ${chatId}\nGeçmiş:\n${historyText}\n\nKullanıcı mesajı: ${message}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.85,
        max_tokens: 220,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return respond({ reply: "Bir sorun oldu, az sonra yazayım." });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return respond({ reply: "Tamam, devam edelim." });
    }

    return respond({ reply });

  } catch (err) {
    return respond({ reply: "Bir aksilik oldu, toparlıyorum." });
  }
};

function respond(obj) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
