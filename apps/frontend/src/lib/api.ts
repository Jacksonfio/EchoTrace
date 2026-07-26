import type {
  Investigation,
  InvestigationDetail,
  Evidence,
  APIResponse,
  AnalysisResponse,
  ChatResponse,
} from '@echotrace/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8000';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Inject auth token from localStorage for all API calls
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('echotrace_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Merge with any custom headers
  if (options?.headers) {
    const customHeaders = options.headers as Record<string, string>;
    Object.assign(headers, customHeaders);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
}

// ===== Auth API =====

export async function authLogin(
  email: string,
  password: string,
): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
  const res = await fetch(`${AUTH_SERVICE_URL}/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.detail || error.error || 'Invalid email or password');
  }

  const data = await res.json();
  return data.data;
}

export async function authSignup(
  email: string,
  password: string,
  name: string,
): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
  const res = await fetch(`${AUTH_SERVICE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.detail || error.error || 'Registration failed');
  }

  const data = await res.json();
  return data.data;
}

export async function authVerify(
  token: string,
): Promise<{ id: string; email: string; name: string }> {
  const res = await fetch(`${AUTH_SERVICE_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.detail || error.error || 'Token verification failed');
  }

  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Token is invalid');
  return data.data;
}

export async function authRefresh(
  token: string,
): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
  const res = await fetch(`${AUTH_SERVICE_URL}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.detail || error.error || 'Token refresh failed');
  }

  const data = await res.json();
  return data.data;
}

export async function authGoogle(
  email: string,
  name: string,
): Promise<{ user: { id: string; email: string; name: string }; token: string }> {
  const res = await fetch(`${AUTH_SERVICE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, google_id: email }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.detail || error.error || 'Google authentication failed');
  }

  const data = await res.json();
  return data.data;
}

// ===== Investigations =====

export async function listInvestigations(): Promise<Investigation[]> {
  const res = await fetchAPI<APIResponse<Investigation[]>>('/investigations');
  return res.data || [];
}

export async function createInvestigation(
  title: string,
  description?: string,
): Promise<Investigation> {
  const res = await fetchAPI<APIResponse<Investigation>>('/investigations', {
    method: 'POST',
    body: JSON.stringify({ title, description }),
  });
  return res.data!;
}

export async function getInvestigation(
  id: string,
): Promise<InvestigationDetail> {
  const res = await fetchAPI<APIResponse<InvestigationDetail>>(
    `/investigations/${id}`,
  );
  return res.data!;
}

export async function deleteInvestigation(id: string): Promise<void> {
  await fetchAPI(`/investigations/${id}`, { method: 'DELETE' });
}

export async function updateInvestigation(
  id: string,
  data: Partial<Investigation>,
): Promise<Investigation> {
  const res = await fetchAPI<APIResponse<Investigation>>(
    `/investigations/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );
  return res.data!;
}

// ===== Upload =====

export async function uploadEvidence(
  investigationId: string,
  file: File,
  type?: string,
  description?: string,
): Promise<Evidence> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('type', type);
  if (description) formData.append('description', description);
  formData.append('name', file.name);

  // Inject auth token header for form upload
  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('echotrace_auth_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(
    `${API_BASE}/upload/${investigationId}`,
    { method: 'POST', body: formData, headers: authHeaders },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Upload failed');
  }

  const data = await res.json();
  return data.data;
}

export async function uploadEvidenceBatch(
  investigationId: string,
  files: File[],
): Promise<Evidence[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));

  // Inject auth token header for form upload
  const authHeaders: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('echotrace_auth_token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(
    `${API_BASE}/upload/${investigationId}/batch`,
    { method: 'POST', body: formData, headers: authHeaders },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Batch upload failed');
  }

  const data = await res.json();
  return data.data;
}

// ===== Analysis =====

export async function runAnalysis(
  investigationId: string,
): Promise<AnalysisResponse> {
  const res = await fetchAPI<APIResponse<AnalysisResponse>>(
    `/analyze/${investigationId}`,
    { method: 'POST' },
  );
  return res.data!;
}

export async function getAnalysisResults(
  investigationId: string,
): Promise<AnalysisResponse['extractedData']> {
  const res = await fetchAPI<APIResponse<AnalysisResponse['extractedData']>>(
    `/analyze/${investigationId}`,
  );
  return res.data!;
}

// ===== Chat =====

export async function sendChatMessage(
  investigationId: string,
  message: string,
): Promise<ChatResponse> {
  const res = await fetchAPI<APIResponse<ChatResponse>>(
    `/chat/${investigationId}`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
  );
  return res.data!;
}

// ===== Seed =====

export async function seedDemoData(): Promise<InvestigationDetail> {
  const res = await fetchAPI<APIResponse<InvestigationDetail>>('/seed', {
    method: 'POST',
  });
  return res.data!;
}
