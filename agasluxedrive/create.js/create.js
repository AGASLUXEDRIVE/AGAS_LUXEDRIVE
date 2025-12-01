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
    const car = req.body;
    if (!car || !car.id) {
      res.status(400).json({ error: 'Invalid car payload' });
      return;
    }
    if (!Array.isArray(car.images)) car.images = car.images ? [car.images].filter(Boolean) : [];
    if (!car.status) car.status = 'pending';
    if (typeof car.verified !== 'boolean') car.verified = car.status === 'approved';
    const { data, error } = await client.from('cars').upsert(car, { onConflict: 'id' }).select('*').single();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, car: data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save car' });
  }
}
