<!-- <h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p> -->
<!-- web/src/routes/+page.svelte -->
<script lang="ts">
  import { marked } from 'marked';
  interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  let messages = $state<Message[]>([]);
  let query = $state('');
  let selectedDepartment = $state('');
  let isLoading = $state(false);

  const departments = ['All', 'HCM', 'MIS'];

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    query = '';

    // Append User Message
    messages = [...messages, { role: 'user', content: userMessage }];
    
    // Prepare Assistant Placeholder Message
    messages = [...messages, { role: 'assistant', content: '' }];
    const assistantIndex = messages.length - 1;
    
    isLoading = true;

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          department: selectedDepartment === 'All' ? null : selectedDepartment || null
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Gagal terhubung ke API Chatbot.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        messages[assistantIndex].content += textChunk;
        messages = [...messages]; // Trigger reactivity update
      }
    } catch (error: any) {
      messages[assistantIndex].content = `Error: ${error.message || 'Terjadi kesalahan sistem.'}`;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="chat-wrapper">
  <header class="chat-header">
    <h2>Asisten SOP & IK Knowledge Base</h2>
    <div class="filter-box">
      <label for="dept-select">Filter Departemen:</label>
      <select id="dept-select" bind:value={selectedDepartment} disabled={isLoading}>
        {#each departments as dept}
          <option value={dept === 'All' ? '' : dept}>{dept}</option>
        {/each}
      </select>
    </div>
  </header>

  <main class="message-container">
    {#if messages.length === 0}
      <div class="empty-state">
        <p>Silakan tanyakan sesuatu terkait SOP atau Instruksi Kerja (IK).</p>
      </div>
    {/if}

    {#each messages as msg}
      <div class="message-bubble {msg.role}">
        <div class="avatar">{msg.role === 'user' ? 'Anda' : 'Bot'}</div>
        <div class="content">{@html marked.parse(msg.content) || (isLoading ? 'Mencari dokumen & mengetik...' : '')}</div>
      </div>
    {/each}
  </main>

  <form onsubmit={handleSubmit} class="input-form">
    <input
      type="text"
      bind:value={query}
      placeholder="Ketik pertanyaan SOP/IK di sini..."
      disabled={isLoading}
    />
    <button type="submit" disabled={isLoading || !query.trim()}>
      {isLoading ? '...' : 'Kirim'}
    </button>
  </form>
</div>

<style>
  .chat-wrapper {
    max-width: 800px;
    margin: 2rem auto;
    display: flex;
    flex-direction: column;
    height: 80vh;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    font-family: sans-serif;
  }

  .chat-header {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
  }

  .filter-box select {
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
  }

  .message-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    color: #64748b;
    margin-top: 4rem;
  }

  .message-bubble {
    display: flex;
    gap: 0.8rem;
    max-width: 80%;
  }

  .message-bubble.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .message-bubble.assistant {
    align-self: flex-start;
  }

  .avatar {
    font-weight: bold;
    font-size: 0.8rem;
    background: #e2e8f0;
    padding: 0.4rem 0.6rem;
    border-radius: 50%;
    height: fit-content;
  }

  .message-bubble.user .avatar {
    background: #2563eb;
    color: white;
  }

  .content {
    background: #f1f5f9;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  .message-bubble.user .content {
    background: #2563eb;
    color: white;
  }

  .input-form {
    display: flex;
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    gap: 0.5rem;
  }

  .input-form input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 1rem;
  }

  .input-form button {
    padding: 0.75rem 1.5rem;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
  }

  .input-form button:disabled {
    background: #94a3b8;
    cursor: not-allowed;
  }
</style>