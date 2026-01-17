const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

exports.handler = async function (event) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({ reply: "API key yok 😵‍💫" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const message = body.message || "selam";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Sen Fatih’in samimi, biraz eğlenceli ama saygılı konuşan sohbet oyunundaki partnerisin.",
          },
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "OpenAI hata döndü 😵‍💫",
          status: response.status,
          error: data,
        }),
      };
    }

    const reply =
      data?.choices?.[0]?.message?.content || "Bir an afalladım 😅";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "Function çöktü 😵",
        error: String(err),
      }),
    };
  }
};
