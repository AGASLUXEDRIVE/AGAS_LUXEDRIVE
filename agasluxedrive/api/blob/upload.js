import { put } from '@vercel/blob';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const filename = (req.query.fileName || `image_${Date.now()}`).toString();
    const token = process.env.VERCEL_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      res.status(500).json({ error: 'Missing blob token' });
      return;
    }
    const result = await put(filename, req, { access: 'public', token });
    res.status(200).json({ url: result.url });
  } catch (_) {
    res.status(500).json({ error: 'Upload failed' });
  }
}