// On Vercel: VITE_API_BASE_URL is not set so BASE_URL = '' — all fetches use
// relative paths (e.g. /api/v1/query) which vercel.json rewrites to the EC2 backend.
// In local dev: .env sets VITE_API_BASE_URL=http://54.235.26.154:8000 so it hits EC2 directly.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(errorText || `HTTP error! Status: ${response.status}`);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const apiClient = {
  async ingest(sourceType, source) {
    const response = await fetch(`${BASE_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_type: sourceType,
        source: source,
      }),
    });
    return handleResponse(response);
  },

  async ingestPDF(file) {
    // file is a browser File object from <input type="file">
    const formData = new FormData();
    formData.append('file', file, file.name);

    const response = await fetch(`${BASE_URL}/api/v1/ingest/pdf-upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },

  async query(queryText, topK = 5) {
    const response = await fetch(`${BASE_URL}/api/v1/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryText,
        top_k: topK,
      }),
    });
    return handleResponse(response);
  },

  async voice(audioBlob) {
    const formData = new FormData();
    // Use standard 'audio' field name as expected by backend router
    formData.append('audio', audioBlob, 'query.webm');

    const response = await fetch(`${BASE_URL}/api/v1/voice`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(errorText || `HTTP error! Status: ${response.status}`);
    }

    // Since /voice returns audio/mpeg streaming, get the response as a blob
    return response.blob();
  },

  async getDocuments() {
    const response = await fetch(`${BASE_URL}/api/v1/documents`, {
      method: 'GET',
    });
    return handleResponse(response);
  },

  async deleteDocuments(documentIds) {
    // Note: The backend expects a raw JSON array of strings, e.g. ["uuid1", "uuid2"]
    const response = await fetch(`${BASE_URL}/api/v1/documents`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentIds),
    });
    return handleResponse(response);
  },
};
