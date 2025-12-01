export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { username, password } = req.body || {};
    const envUser = process.env.ADMIN_USERNAME || 'admin';
    const envPass = process.env.ADMIN_PASSWORD || '';
    const token = process.env.ADMIN_API_TOKEN || '';
    if (!token) {
      res.status(500).json({ error: 'Server not configured' });
      return;
    }
    const ok = username === envUser && password === envPass && !!envPass;
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const cookie = `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 8}`;
    if ((req.headers['x-forwarded-proto'] || '').toLowerCase() === 'https') {
      res.setHeader('Set-Cookie', cookie + '; Secure');
    } else {
      res.setHeader('Set-Cookie', cookie);
    }
    res.status(200).json({ ok: true });
  } catch (_) {
    res.status(500).json({ error: 'Login failed' });
  }
}