import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const cookieHeader = req.headers['cookie'] || '';
    const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('admin_session='));
    const cookieVal = match ? decodeURIComponent(match.split('=')[1] || '') : '';
    const provided = req.headers['x-admin-token'];
    const authed = !!adminToken && ((cookieVal && cookieVal === adminToken) || (provided && provided === adminToken));
    if (!authed) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      res.status(500).json({ error: 'Missing Supabase credentials' });
      return;
    }
    const client = createClient(url, key);

    const { path, carId, docKey, expiresIn = 600 } = req.body || {};
    let resolvedPath = path || '';
    if (!resolvedPath) {
      if (!carId || !docKey) {
        res.status(400).json({ error: 'Provide either path, or carId and docKey' });
        return;
      }
      const { data, error } = await client.from('cars').select('kycDocuments').eq('id', carId).single();
      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }
      const kyc = data && data.kycDocuments;
      if (!kyc || !kyc[docKey]) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }
      resolvedPath = kyc[docKey];
    }

    const { data: signed, error: signErr } = await client.storage.from('confidential-docs').createSignedUrl(resolvedPath, Number(expiresIn));
    if (signErr) {
      res.status(500).json({ error: signErr.message });
      return;
    }
    res.status(200).json({ signedUrl: signed?.signedUrl, path: resolvedPath, expiresIn: Number(expiresIn) });
  } catch (_) {
    res.status(500).json({ error: 'Failed to create signed download url' });
  }
}