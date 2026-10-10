const API_BASE_URL_URL = import.meta.env.VITE_API_BASE_URL_URL || 'https://portfolio-agent-backend-8b2p.onrender.com';

function getAuthHeader() {
  const token = localStorage.getItem("portfolio_agent_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errJson = await response.json();
      if (Array.isArray(errJson.detail)) {
        errorDetail = errJson.detail.map(d => d.msg || d.message || JSON.stringify(d)).join(". ");
      } else if (typeof errJson.detail === "object" && errJson.detail !== null) {
        errorDetail = JSON.stringify(errJson.detail);
      } else if (errJson.detail) {
        errorDetail = errJson.detail;
      } else if (errJson.message) {
        errorDetail = errJson.message;
      } else {
        errorDetail = JSON.stringify(errJson);
      }
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail || `HTTP error ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

export const api = {
  // --- Auth ---
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me"),

  // --- Profile ---
  getProfile: () => request("/profile"),
  updateProfile: (data) => request("/profile", { method: "PUT", body: JSON.stringify(data) }),

  // --- Projects ---
  getProjects: () => request("/projects"),
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  // --- Portfolios ---
  createPortfolio: (data) => request("/portfolios", { method: "POST", body: JSON.stringify(data) }),
  getPortfolios: () => request("/portfolios"),
  getPortfolio: (id) => request(`/portfolios/${id}`),
  updateTheme: (id, data) => request(`/portfolios/${id}/theme`, { method: "PATCH", body: JSON.stringify(data) }),
  getPlan: (id) => request(`/portfolios/${id}/plan`),
  approvePlan: (id, data) => request(`/portfolios/${id}/plan/approve`, { method: "POST", body: JSON.stringify(data) }),
  nlEdit: (id, instruction) => request(`/portfolios/${id}/edit`, { method: "POST", body: JSON.stringify({ instruction }) }),
  manualUpdate: (id, content) => request(`/portfolios/${id}/content`, { method: "PATCH", body: JSON.stringify({ content }) }),
  reorderProjects: (id, data) => request(`/portfolios/${id}/projects/order`, { method: "PUT", body: JSON.stringify(data) }),
  getVersions: (id) => request(`/portfolios/${id}/versions`),
  restoreVersion: (id, versionId) => request(`/portfolios/${id}/versions/${versionId}/restore`, { method: "POST" }),

  // --- Deployments ---
  deployPortfolio: (id, options = {}) => request(`/portfolios/${id}/deploy`, { method: "POST", body: JSON.stringify(options) }),

  // --- Export & Preview URLs ---
  getPreviewUrl: (portfolioId, template = "clean", theme = null, accent = null, layout = null) => {
    let url = `${API_BASE_URL}/portfolios/${portfolioId}/preview?template=${template}`;
    if (layout) url += `&layout=${encodeURIComponent(layout)}`;
    if (theme) url += `&theme=${encodeURIComponent(theme)}`;
    if (accent) url += `&accent=${encodeURIComponent(accent)}`;
    url += `&t=${Date.now()}`;
    return url;
  },
  getExportUrl: (portfolioId, template = "clean", theme = null, accent = null, layout = null) => {
    let url = `${API_BASE_URL}/portfolios/${portfolioId}/export?template=${template}`;
    if (layout) url += `&layout=${encodeURIComponent(layout)}`;
    if (theme) url += `&theme=${encodeURIComponent(theme)}`;
    if (accent) url += `&accent=${encodeURIComponent(accent)}`;
    return url;
  },

  // --- Runs, Agent Status & Clarifications ---
  getAgentStatus: () => request("/agent/status"),
  getRunStatus: (runId) => request(`/runs/${runId}/status`),
  getQuestions: (runId) => request(`/runs/${runId}/questions`),
  submitAnswers: (runId, answers, generateAnyway = false) =>
    request(`/runs/${runId}/answers`, {
      method: "POST",
      body: JSON.stringify({ answers, generate_anyway: generateAnyway })
    }),

  // --- SSE Event Stream ---
  connectSSE: (portfolioId, runId, onMessage, onError) => {
    const url = `${API_BASE_URL}/portfolios/${portfolioId}/runs/${runId}/events`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Error parsing SSE event:", err, event.data);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE connection error or closed:", err);
      if (onError) onError(err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  },

  // --- Developer API Keys & v1 Gateway ---
  getApiKeys: () => request("/developer/keys"),
  createApiKey: (name) => request("/developer/keys", { method: "POST", body: JSON.stringify({ name }) }),
  revokeApiKey: (id) => request(`/developer/keys/${id}`, { method: "DELETE" }),
  generateViaApiKey: (apiKey, payload) =>
    request("/v1/generate", {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: JSON.stringify(payload)
    })
};
