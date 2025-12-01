import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }
  try {
    const adminToken = process.env.ADMIN_API_TOKEN;
    const cookieHeader = req.headers['cookie'] || '';
    const match = cookieHeader.split(';').map(s=>s.trim()).find(s=>s.startsWith('admin_session='));
    const cookieVal = match ? decodeURIComponent(match.split('=')[1] || '') : '';
    if (!adminToken || !cookieVal || cookieVal !== adminToken) {
      res.status(401).send('Unauthorized');
      return;
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      res.status(500).send('Missing Supabase credentials');
      return;
    }
    const client = createClient(url, key);

    const carId = req.query.carId;
    const docKey = req.query.docKey;
    const pathParam = req.query.path;
    const expiresIn = parseInt(req.query.expiresIn || '600');

    let path = pathParam || '';
    if (!path) {
      if (!carId || !docKey) {
        res.status(400).send('Provide either path, or carId and docKey');
        return;
      }
      const { data, error } = await client.from('cars').select('kycDocuments').eq('id', carId).single();
      if (error) {
        res.status(500).send(error.message);
        return;
      }
      const kyc = data && data.kycDocuments;
      if (!kyc || !kyc[docKey]) {
        res.status(404).send('Document not found for given car/docKey');
        return;
      }
      path = kyc[docKey];
    }

    const { data: signed, error: signErr } = await client.storage.from('confidential-docs').createSignedUrl(path, expiresIn);
    if (signErr) {
      res.status(500).send(signErr.message);
      return;
    }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Confidential Document</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px;}a{color:#0A1A2F} .box{border:1px solid #e5e7eb;border-radius:12px;padding:16px} .btn{display:inline-block;background:#0A1A2F;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none} .muted{color:#6b7280}</style></head><body><h1>Confidential Document</h1><div class="box"><p class="muted">Path: ${path}</p><p class="muted">Expires in: ${expiresIn}s</p><p><a class="btn" href="${signed?.signedUrl}" target="_blank" rel="noopener noreferrer">Open Document</a></p></div></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send('Failed to render document');
  }
}
