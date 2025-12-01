import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const blobToken = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN || '';
    const adminToken = process.env.ADMIN_API_TOKEN || '';
    const env = {
      SUPABASE_URL: !!url,
      SUPABASE_SERVICE_ROLE_KEY: !!key,
      VERCEL_BLOB_TOKEN: !!blobToken,
      ADMIN_API_TOKEN: !!adminToken
    };
    let supabase = { ok: false };
    let storage = { ok: false, hasConfidentialBucket: false };
    if (url && key) {
      const client = createClient(url, key);
      const cars = await client.from('cars').select('id').limit(1);
      const rentals = await client.from('rentals').select('id').limit(1);
      supabase.ok = !cars.error && !rentals.error;
      try {
        const buckets = await client.storage.listBuckets();
        storage.ok = !buckets.error;
        storage.hasConfidentialBucket = Array.isArray(buckets.data) && buckets.data.some(b => b.name === 'confidential-docs');
      } catch (_) {}
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ env, supabase, storage });
  } catch (_) {
    res.status(500).json({ error: 'Health check failed' });
  }
}