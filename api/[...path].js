/**
 * Vercel Serverless Proxy — catches every /api/* request from the frontend,
 * forwards it to the AWS EC2 FastAPI backend server-side (no CORS / Mixed Content),
 * and pipes the response back verbatim.
 *
 * Works for: JSON endpoints, multipart PDF uploads, streaming audio responses.
 */

export const config = {
  api: {
    bodyParser: false,   // receive raw bytes — needed for multipart and audio
    responseLimit: false,
  },
};

const BACKEND = 'http://54.235.26.154:8000';

export default async function handler(req, res) {
  const target = `${BACKEND}${req.url}`;

  // Collect the raw request body (handles JSON, multipart/form-data, audio)
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const rawBody = Buffer.concat(chunks);

  // Forward only the relevant headers — drop host so EC2 doesn't reject it
  const forwardHeaders = {};
  const PASS_THROUGH = ['content-type', 'accept', 'accept-language', 'accept-encoding'];
  for (const key of PASS_THROUGH) {
    if (req.headers[key]) forwardHeaders[key] = req.headers[key];
  }
  if (rawBody.length > 0) {
    forwardHeaders['content-length'] = String(rawBody.length);
  }

  const fetchOptions = {
    method: req.method,
    headers: forwardHeaders,
  };
  if (req.method !== 'GET' && req.method !== 'HEAD' && rawBody.length > 0) {
    fetchOptions.body = rawBody;
  }

  try {
    const upstream = await fetch(target, fetchOptions);

    // Forward status and key response headers
    res.status(upstream.status);
    const ct = upstream.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);

    // Stream response body back (works for binary audio too)
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('[proxy] error:', err);
    res.status(502).json({ detail: `Proxy error: ${String(err)}` });
  }
}
