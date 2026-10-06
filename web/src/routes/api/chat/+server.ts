// web/src/routes/api/chat/+server.ts
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CHAT_ENDPOINT } from '$lib/api';
import { env } from '$env/dynamic/private';
import { sourceLinksMarkdown } from '$lib/server/chat-sources';

export const POST: RequestHandler = async ({ request }) => {
  try {
    // 1. Ambil data (pertanyaan) dari Browser
    const body = await request.json();

    // 2. Ambil token rahasia dari environment variables SvelteKit
    const SECRET_TOKEN = env.APP_SECRET_TOKEN || 
    (() => {throw error(500, 'APP_SECRET_TOKEN tidak ditemukan'); })();

    // 3. Teruskan ke API Flask. 
    // Karena SvelteKit dan Flask berada di dalam jaringan Docker Compose yang sama, 
    // kita bisa memanggil nama servicenya langsung: 'http://api:5000'
    const flaskResponse = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET_TOKEN}` // Token disisipkan di server (aman)
      },
      body: JSON.stringify(body)
    });

    if (!flaskResponse.ok) {
        const errText = await flaskResponse.text();
        throw error(flaskResponse.status, `Gagal terhubung ke Backend Flask: ${errText}`);
    }

    // 4. Kembalikan stream ke Browser, ditutup dengan link ke dokumen sumbernya
    const links = sourceLinksMarkdown(flaskResponse.headers.get('x-chat-sources'));
    const stream = links && flaskResponse.body
      ? flaskResponse.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            flush: (controller) => controller.enqueue(new TextEncoder().encode(links))
          })
        )
      : flaskResponse.body;

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });

  } catch (err: any) {
    throw error(500, err.message || 'Internal Server Error');
  }
};