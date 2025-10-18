// Advisor chat client for llama via Flask proxy
// Uses /api/advisor_chat which calls a local Ollama server (http://localhost:11434)

(function() {
  const form = document.getElementById('advisor-form');
  const input = document.getElementById('advisor-input');
  const sendBtn = document.getElementById('advisor-send');
  const chat = document.getElementById('advisor-chat');
  const loading = document.getElementById('advisor-loading');

  const params = {
    repeat_penalty: 1.1,
    frequency_penalty: 0.3,
    temperature: 0.6,
    top_p: 0.9,
    top_k: 40,
    max_tokens: 160,
    presence_penalty: 0.6,
  };

  const conversation = [];

  function appendBubble(role, text) {
    const wrap = document.createElement('div');
    wrap.className = 'advisor-row ' + (role === 'assistant' ? 'ai' : 'user');

    const bubble = document.createElement('div');
    bubble.className = 'advisor-bubble';
    bubble.textContent = text;

    wrap.appendChild(bubble);
    chat.appendChild(wrap);
    chat.scrollTop = chat.scrollHeight;
  }

  function setLoading(isLoading) {
    sendBtn.disabled = isLoading;
    input.disabled = isLoading;
    loading.style.display = isLoading ? 'block' : 'none';
  }

  async function sendMessage(prompt) {
    const body = {
      model: 'llama3.2:3b',
      messages: conversation,
      options: {
        temperature: params.temperature,
        top_p: params.top_p,
        top_k: params.top_k,
        num_predict: params.max_tokens,
        repeat_penalty: params.repeat_penalty,
        presence_penalty: params.presence_penalty,
        frequency_penalty: params.frequency_penalty,
      },
    };

    const resp = await fetch('/api/advisor_chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error('Chat request failed: ' + txt);
    }

    const data = await resp.json();
    let reply = (data.bot || '').trim();
    // Strip common markdown: **bold**, *italic*, `code`, headings
    reply = reply
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s+/gm, '');
    // Heuristic shortening: prefer the first 3 sentences or ~500 chars
    const sentences = reply.split(/(?<=[.!?])\s+/);
    if (sentences.length > 3) {
      reply = sentences.slice(0, 3).join(' ');
    }
    if (reply.length > 500) {
      reply = reply.slice(0, 500) + '…';
    }
    return reply;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    appendBubble('user', text);
    conversation.push({ role: 'user', content: text });

    input.value = '';
    setLoading(true);

    try {
      // Encourage concise answers on first turn
      if (conversation.length === 1) {
        conversation.unshift({ role: 'system', content: 'Keep answers concise, practical, and student-friendly.' });
      }
      const reply = await sendMessage(text);
      appendBubble('assistant', reply);
      conversation.push({ role: 'assistant', content: reply });
    } catch (err) {
      appendBubble('assistant', 'Sorry, there was an error contacting the advisor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  });
})();
