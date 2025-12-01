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
    const { fileName, carId } = req.body || {};
    if (!fileName || !carId) {
      res.status(400).json({ error: 'fileName and carId required' });
      return;
    }
    const client = createClient(url, key);
    const path = `${carId}/${Date.now()}_${fileName}`;
    const { data, error } = await client
      .storage
      .from('confidential-docs')
      .createSignedUploadUrl(path);
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ signedUrl: data.signedUrl, path });
  } catch (_) {
    res.status(500).json({ error: 'Failed to create signed upload url' });
  }
}