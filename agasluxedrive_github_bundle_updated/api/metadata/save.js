import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,OPTIONS' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers })
  const body = await req.json()
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { global: { fetch } })
  const row = {
    car_id: body.carId || null,
    seller_name: body.sellerName || null,
    seller_email: body.sellerEmail || null,
    seller_phone: body.sellerPhone || null,
    make: body.make || null,
    model: body.model || null,
    year: body.year ? parseInt(body.year, 10) : null,
    spec: body.spec || null,
    files: body.files || [],
    created_at: new Date().toISOString()
  }
  const { data, error } = await supabase.from('car_uploads').insert(row).select('*').limit(1)
  if (error) return new Response(JSON.stringify({ error: 'supabase_insert_failed' }), { status: 500, headers })
  return new Response(JSON.stringify({ ok: true, record: data && data[0] ? data[0] : row }), { status: 200, headers })
}
