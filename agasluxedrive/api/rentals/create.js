import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      res.status(500).json({ error: 'Missing Supabase credentials' });
      return;
    }
    const client = createClient(url, key);
    const rental = req.body;
    if (!rental || !rental.id) {
      res.status(400).json({ error: 'Invalid rental payload' });
      return;
    }
    const { data, error } = await client
      .from('rentals')
      .upsert(rental, { onConflict: 'id' })
      .select('*')
      .single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ ok: true, rental: data });
  } catch (_) {
    res.status(500).json({ error: 'Failed to save rental' });
  }
}