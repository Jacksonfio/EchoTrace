import type {
  Investigation,
  InvestigationDetail,
  Evidence,
  APIResponse,
  AnalysisResponse,
  ChatResponse,
} from '@echotrace/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `API Error: ${res.status}`);
  }

  return res.json();
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

  const res = await fetch(
    `${API_BASE}/upload/${investigationId}`,
    { method: 'POST', body: formData },
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

  const res = await fetch(
    `${API_BASE}/upload/${investigationId}/batch`,
    { method: 'POST', body: formData },
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
