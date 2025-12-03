import { put } from '@vercel/blob'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers })
  const url = new URL(req.url)
  const fileName = url.searchParams.get('fileName') || `upload-${Date.now()}`
  const contentType = req.headers.get('content-type') || 'application/octet-stream'
  const buf = await req.arrayBuffer()
  try {
    const blob = await put(`cars/${fileName}`, new Uint8Array(buf), { access: 'public', contentType, token: process.env.BLOB_READ_WRITE_TOKEN })
    return new Response(JSON.stringify({ url: blob.url, pathname: blob.pathname, size: blob.size }), { status: 200, headers })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'upload_failed' }), { status: 500, headers })
  }
}
