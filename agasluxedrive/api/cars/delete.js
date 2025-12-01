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
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ error: 'id required' });
      return;
    }
    const client = createClient(url, key);
    const { error } = await client.from('cars').delete().eq('id', id);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true });
  } catch (_) {
    res.status(500).json({ error: 'Failed to delete car' });
  }
}