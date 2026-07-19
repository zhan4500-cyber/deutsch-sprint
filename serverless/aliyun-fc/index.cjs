const allowedModes = new Set(["correction", "grammar", "translation", "business"]);

const json = (statusCode, body, origin) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin || "null",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  },
  body: JSON.stringify(body)
});

const readRequest = (event) => typeof event === "string" ? JSON.parse(event) : event;

const parseModelJson = (content) => {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Model did not return JSON.");
  return JSON.parse(match[0]);
};

const promptFor = ({ mode, text, profile }) => `
You are Deutsch Sprint's German tutor for Chinese university students.
Mode: ${mode}. Stage: ${profile.stage}. Explanation preference: ${profile.explanationStyle}.
Recent error tags: ${(profile.recentErrors || []).join(", ") || "none"}.
Student input: ${text}

Give a helpful German-learning answer. Diagnose grammar, lexical, translation, or register issues as appropriate. Do not claim an answer is the only possible translation when alternatives exist. Return only JSON with this exact shape:
{"heading":"...","answer":"...","correctedText":"...","errorTags":["..."],"exercise":"..."}
`;

exports.handler = async (event) => {
  const request = readRequest(event);
  const method = request?.requestContext?.http?.method || request?.requestContext?.httpMethod || "POST";
  const origin = request?.headers?.origin || request?.headers?.Origin || "";
  const allowedOrigin = process.env.ALLOWED_ORIGIN;

  if (method === "OPTIONS") return json(204, {}, allowedOrigin || origin);
  if (method !== "POST") return json(405, { error: "Only POST is supported." }, allowedOrigin || origin);
  if (allowedOrigin && origin !== allowedOrigin) return json(403, { error: "Origin is not allowed." }, allowedOrigin);

  let payload;
  try { payload = typeof request.body === "string" ? JSON.parse(request.body) : request.body; }
  catch { return json(400, { error: "Invalid JSON body." }, allowedOrigin || origin); }

  const text = String(payload?.text || "").trim();
  const mode = String(payload?.mode || "");
  const profile = payload?.profile || {};
  if (!allowedModes.has(mode) || !text || text.length > 1600) {
    return json(400, { error: "Invalid tutoring request." }, allowedOrigin || origin);
  }
  if (!process.env.DASHSCOPE_API_KEY || !process.env.QWEN_BASE_URL) {
    return json(503, { error: "AI service is not configured." }, allowedOrigin || origin);
  }

  try {
    const upstream = await fetch(`${process.env.QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DASHSCOPE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL || "qwen-plus",
        temperature: 0.3,
        messages: [{ role: "system", content: "Return concise, valid JSON only." }, { role: "user", content: promptFor({ mode, text, profile }) }]
      })
    });
    if (!upstream.ok) throw new Error(`Qwen request failed: ${upstream.status}`);
    const data = await upstream.json();
    const result = parseModelJson(data.choices?.[0]?.message?.content || "");
    if (!Array.isArray(result.errorTags)) result.errorTags = [];
    return json(200, result, allowedOrigin || origin);
  } catch (error) {
    console.error(error);
    return json(502, { error: "AI analysis is temporarily unavailable." }, allowedOrigin || origin);
  }
};

