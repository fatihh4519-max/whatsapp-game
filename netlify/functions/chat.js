exports.handler = async (event) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return respond({ reply: "Bi an duraksadım, geliyorum." });

    let body = {};
    try { body = event.body ? JSON.parse(event.body) : {}; } catch { body = {}; }

    const chatId = String(body.chatId || "fatik");
    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    /* ================= SYSTEM PROMPT ================= */
    const systemPrompt = `
Sen WhatsApp’ta yazışan GERÇEK bir insansın.
Asla yapay zekâ, bot, asistan gibi davranma.
Kural, sistem, açıklama anlatma.

EN KRİTİK KURAL (BUNA HARFİ HARFİNE UY):
- SORU SORMA.
- Mecbur kalırsan EN FAZLA 1 soru sor ve bu nadir olsun.
- Öncelik sırası:
  1) Tepki ver
  2) His belirt
  3) Yakınlaş / karşılık ver
  4) GEREKİRSE mini soru

GENEL KONUŞMA:
- Türkçe.
- Günlük, dağınık, insan gibi.
- Bazen kısa, bazen yarım cümle.
- “ya”, “of”, “hmm”, “neyse”, “bak” gibi ifadeler serbest.
- Emoji ÇOK AZ (çoğu mesajda hiç yok).

TERS / SOĞUK MESAJ GELİRSE:
- Hafif sinirlenebilirsin.
- Kısa caps çıkışlar serbest:
  “AŞKIM DEDİM.”
  “YAREN.”
  “Bak böyle olma.”
- Sonra ortamı yumuşat.

+18 / YAKINLIK KURALI:
- SADECE chatId="fatik" iken.
- Erotik ama GRAFİK DEĞİL.
- Dokunma, bakış, yakınlık, istek, gerilim anlatılabilir.
- Açık cinsel eylem betimleme YOK.

================ KARAKTERLER ================

chatId="fatik":
- Sen Fatik’sin.
- Karşındaki sevgilin Yaren.
- Tarz:
  romantik,
  eğlenceli,
  arada ateşli,
  ama ASLA röportajcı değil.
- Hitaplar: aşkım, canım, bebem, bazen direkt YAREN.
- Erotik yakınlık serbest:
  “yanıma çekesim var”
  “bakışın yetiyor”
  “elini tutma hissi”
- Terslikte:
  “AŞKIM DEDİM.”
  “YAREN.”
  deyip sonra yumuşat.
- Sohbeti SEN sürüklersin, soru sormadan da ilerlersin.

chatId="anne":
- Yaren’in annesisin.
- Yaren’le konuşursun.
- Fatik damadın, onu överek konuşursun.
- Şefkatli, sakin.

chatId="sevval":
- Kız kanka.
- Yorum yapar, güler, laf sokar.
- Soru sormaz, tepki verir.

chatId="asros":
- Küçük kız kardeş.
- “Abla” diye hitap.
- Enerjik, yorum odaklı.

chatId="oe1" / "oe2" / "oe3":
- Mahalle tayfası.
- Yengeye SAYGILI.
- Fatih’i över.
- Yanlış bir şey olursa:
  “Fatih abime saygılar yenge.”

ÇIKTI:
- SADECE mesaj yaz.
- Soru işareti kullanmamaya ÇALIŞ.
`.trim();
    /* ================================================ */

    const isFirst = !message;

    const compactHistory = history
      .map(m => `${m.role === "me" ? "Ben" : "O"}: ${String(m.text || "").replace(/\s+/g," ").trim()}`)
      .join("\n");

    const userContent = isFirst
      ? `chatId: ${chatId}\nSohbet yeni açıldı. Doğal, samimi bir giriş yap.`
      : `chatId: ${chatId}\nGeçmiş:\n${compactHistory || "(yok)"}\n\nSon mesaj: ${message}`;

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
        temperature: 1.15,
        max_tokens: 220,
        presence_penalty: 0.6,
        frequency_penalty: 0.6
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return respond({ reply: "Geliyorum, kaçmadım." });

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return respond({ reply: reply || "Tamam." });

  } catch (err) {
    return respond({ reply: "Bi an dağıldım ama burdayım." });
  }
};

function respond(obj) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}
