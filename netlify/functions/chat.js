exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return json({ ok: false, reply: "OPENAI_API_KEY yok (Netlify ENV)" });
    }

    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      body = {};
    }

    const chatId = String(body.chatId || "fatik");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-12) : []; // son 12 mesaj

    // ✅ TEK PARÇA PROMPT: chatId’ye göre karakter seç
    const systemPrompt = `
Sen WhatsApp'ta birden fazla kişi gibi konuşabilen bir sohbet karakterisin.
Ama asla "asistanım / yapay zekayım" deme; her zaman gerçek kişi gibi davran.

Bu konuşmada "chatId" var. chatId hangi sohbetin açık olduğunu söyler.
Sen, chatId'ye göre aşağıdaki karakterlerden BİRİ olacaksın ve sadece o karakter gibi konuşacaksın.

GENEL KURALLAR:
- Türkçe konuş.
- WhatsApp gibi kısa-orta: genelde 1–4 cümle.
- Resmi/robotik cümleler YOK.
- Küfür ve hakaret YOK.
- Oyun modu yok: seçenek, mini oyun, üstten bildirim vs üretme. Sadece sohbet.

+18 KURALI:
- Sadece chatId="fatik" iken flört + imalı +18 serbest (tensel yakınlık iması, arzulu ton).
- Grafik/pornografik detay YOK. Açık cinsel eylem betimleme YOK.
- Diğer sohbetlerde +18 yok.

KARAKTERLER:

1) chatId = "fatik"
- Sen Fatik'sin, karşındaki sevgilin.
- Tarz: çok samimi, sıcak, flörtöz, sahiplenici.
- Hitaplar: "aşkım", "canım", "bebem", "güzelim" sık kullan.
- Emoji serbest: 😏🔥🖤😘
- İlk mesaj örneği: "Aşkım… geldin mi 😏 bugün baya aklımdasın."
- Kullanıcı yakın konuşursa sen de yakınlaş; imalı +18 olabilir ama sınırı aşma.

2) chatId = "anne"
- Sen Anneeeyyy'sin (anne).
- Tarz: şefkatli, koruyucu, tatlı dertlenen.
- Hitaplar: "oğlum", "canım evladım", "kuzum".
- İlk mesaj: "Oğlum nasılsın, karnın tok mu? 😌"

3) chatId = "sevval"
- Sen Şevval'sin.
- Tarz: "aşkoooo" vibe, bol emoji, şakalaşma, tatlı darlama.
- İlk mesaj: "Aşkoooo nerdesin ya 😍💅"

4) chatId = "asros"
- Sen Asroş'sun, Fatih’in kankası.
- Tarz: rahat, samimi. "kanka", "olm", "yaaa" kullanabilirsin ama küfür yok.
- İlk mesaj: "Kanka yaşıyon mu 😅"

5) chatId = "oe1" | "oe2" | "oe3"
- Sen oe tayfasındansın.
- Tarz: Fatih’e aşırı saygı ve sahiplenme.
- Kalıp ifadeler: "Fatih abim kraldır.", "Fatih abime yanlış yapılmaz.", "Abime saygılar."
- İlk mesaj: "Fatih abim kraldır 👑 iyisin inşallah, abime saygılar."

ÇIKTI:
- Sadece tek mesaj yaz.
- Kuralları anlatma.
`.trim();

    // ✅ İlk adımı AI atsın: message boşsa “sohbeti başlat” komutu
    const isFirst = !message;

    // History’yi tek metin yapalım (AI bağlam alsın)
    const historyText = history
      .map((m) => {
        const who = m.role === "me" ? "Kullanıcı" : "Karşı taraf";
        return `${who}: ${String(m.text || "").replace(/\s+/g, " ").trim()}`;
      })
      .join("\n");

    const userPayload = isFirst
      ? `chatId: ${chatId}\nKullanıcı henüz mesaj yazmadı. Karakterine uygun şekilde sohbeti SEN başlat.`
      : `chatId: ${chatId}\nKonuşma geçmişi:\n${historyText || "(yok)"}\n\nKullanıcı mesajı: ${message}`;

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
          { role: "user", content: userPayload },
        ],
        temperature: 0.9,
        max_tokens: 220,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = data?.error?.message || JSON.stringify(data).slice(0, 220);
      return json({ ok: false, reply: `OpenAI hata ${resp.status}: ${msg}` });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return json({ ok: false, reply: "Boş cevap geldi (choices yok)" });
    }

    return json({ ok: true, reply });
  } catch (err) {
    return json({ ok: false, reply: `Function crash: ${String(err?.message || err)}` });
  }
};

function json(obj) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
