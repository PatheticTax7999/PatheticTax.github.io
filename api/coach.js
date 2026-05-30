export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not set' });
  }

  try {
    // Combine system prompt with first user message
    let allMessages = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      }
    ];

    // Add conversation messages
    messages.forEach(msg => {
      allMessages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: allMessages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: JSON.stringify(error) });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'No response text' });
    }

    return res.json({ reply: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
