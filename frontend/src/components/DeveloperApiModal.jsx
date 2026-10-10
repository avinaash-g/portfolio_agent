import React, { useState, useEffect } from "react";
import { 
  X, 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Lock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function DeveloperApiModal({ isOpen, onClose, onOpenAuth }) {
  const { isAuthenticated } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [activeCodeTab, setActiveCodeTab] = useState("curl");
  const [codeCopied, setCodeCopied] = useState(false);

  // Load API keys when modal opens and user is logged in
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadKeys();
    } else {
      setNewlyCreatedKey(null);
      setError("");
    }
  }, [isOpen, isAuthenticated]);

  const loadKeys = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getApiKeys();
      setKeys(data || []);
    } catch (err) {
      setError(err.message || "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    setError("");
    try {
      const res = await api.createApiKey(newKeyName.trim());
      setNewlyCreatedKey(res);
      setNewKeyName("");
      await loadKeys();
    } catch (err) {
      setError(err.message || "Failed to create API key.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!window.confirm("Are you sure you want to revoke this API key? Applications using it will immediately be rejected.")) {
      return;
    }
    try {
      await api.revokeApiKey(keyId);
      if (newlyCreatedKey?.id === keyId) {
        setNewlyCreatedKey(null);
      }
      await loadKeys();
    } catch (err) {
      alert("Error revoking key: " + err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  if (!isOpen) return null;

  // Selected key or default token for code snippets
  const activeToken = newlyCreatedKey?.api_key || (keys[0] ? `${keys[0].key_prefix}...` : "pa_live_your_api_key_here");

  const curlSnippet = `curl -X POST https://portfolio-agent.dev/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${activeToken}" \\
  -d '{
    "name": "Alex Rivera",
    "target_role": "Backend Engineer",
    "skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
    "projects": [
      {
        "name": "Cloud Task Hub",
        "description": "High-throughput asynchronous task orchestrator.",
        "technologies": ["Python", "FastAPI", "Redis"],
        "role": "Lead Architect",
        "outcomes": "100k daily task mutations with 99.9% uptime"
      }
    ]
  }'`;

  const pythonSnippet = `import requests

url = "https://portfolio-agent.dev/api/v1/generate"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${activeToken}"
}
payload = {
    "name": "Alex Rivera",
    "target_role": "Backend Engineer",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "projects": [
        {
            "name": "Cloud Task Hub",
            "description": "Real-time task synchronization engine.",
            "technologies": ["Python", "FastAPI", "PostgreSQL"],
            "role": "Lead Architect",
            "outcomes": "Serviced 100k daily task mutations."
        }
    ]
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print(f"Generated Portfolio: {data['portfolio']['hero']['title']}")
print(f"Quality Score: {data['quality_report']['score']}/100")`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B1F3B]/60 backdrop-blur-sm animate-subtle-fade">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-[#E5DFD7] rounded-2xl shadow-2xl overflow-hidden text-[#1B1F3B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DFD7] bg-[#FAF7F4]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B3074] text-white flex items-center justify-center shadow-soft">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1B1F3B] tracking-tight">
                  Developer API Platform
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#6B3074]/10 border border-[#6B3074]/20 text-[#6B3074]">
                  v1.0 Live Gateway
                </span>
              </div>
              <p className="text-xs text-[#1B1F3B]/70">
                Programmatic REST access & autonomous portfolio generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#1B1F3B]/50 hover:text-[#1B1F3B] hover:bg-[#EAE4DC] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {!isAuthenticated ? (
            /* Unauthenticated View */
            <div className="text-center py-10 px-6 space-y-5 bg-[#FAF7F4] border border-[#E5DFD7] rounded-2xl max-w-xl mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#6B3074]/10 border border-[#6B3074]/20 flex items-center justify-center text-[#6B3074]">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-[#1B1F3B]">Sign In to Access Developer API Keys</h3>
                <p className="text-xs text-[#1B1F3B]/75 leading-relaxed max-w-md mx-auto">
                  Generate free API keys to build portfolios programmatically from raw JSON, integrate with CI/CD pipelines, or trigger autonomous recruiter case study generation.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth();
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FF6B6B] hover:bg-[#FA5252] text-white font-semibold text-xs sm:text-sm shadow-coral transition"
                >
                  Sign In or Register (Free)
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated View */
            <div className="space-y-6">
              
              {/* Newly Created Secret Key Banner */}
              {newlyCreatedKey && (
                <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#6B3074]/30 space-y-3 animate-subtle-fade">
                  <div className="flex items-center space-x-2 text-[#6B3074]">
                    <Sparkles className="w-4 h-4 text-[#6B3074]" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      New API Key Created — Save it Now
                    </span>
                  </div>
                  <p className="text-xs text-[#1B1F3B]/80">
                    This is the <span className="font-bold text-[#1B1F3B]">only time</span> the full API key will be displayed. Copy and store it securely in your environment variables.
                  </p>
                  <div className="flex items-center justify-between p-2.5 bg-white border border-[#DCD5CB] rounded-lg font-mono text-xs text-[#1B1F3B]">
                    <span className="truncate select-all">{newlyCreatedKey.api_key}</span>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey.api_key, "newly-created")}
                      className="ml-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-[#6B3074] hover:bg-[#5E1B89] text-white font-sans text-xs font-medium transition"
                    >
                      {copiedKeyId === "newly-created" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Top Action: Create Key */}
              <div className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B1F3B] uppercase tracking-wider">
                    Generate New API Key
                  </h3>
                  <span className="text-xs text-[#1B1F3B]/60 font-mono">
                    Free Tier: 10 calls/day per key
                  </span>
                </div>
                <form onSubmit={handleCreateKey} className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key description (e.g. GitHub Actions, Backend CLI, Staging Gateway)"
                    className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-[#DCD5CB] text-[#1B1F3B] placeholder-[#1B1F3B]/40 text-xs focus:outline-hidden focus:border-[#6B3074] focus:ring-1 focus:ring-[#6B3074] transition"
                  />
                  <button
                    type="submit"
                    disabled={isCreating || !newKeyName.trim()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-[#FF6B6B] hover:bg-[#FA5252] disabled:opacity-50 text-white text-xs font-semibold transition shadow-coral"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isCreating ? "Generating..." : "Generate Key"}</span>
                  </button>
                </form>
              </div>

              {/* Active Keys List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1B1F3B] uppercase tracking-wider">
                    Active API Keys ({keys.length})
                  </h3>
                  <button
                    onClick={loadKeys}
                    className="text-xs text-[#6B3074] hover:underline font-medium transition"
                  >
                    Refresh Quotas
                  </button>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-[#1B1F3B]/50 font-mono">
                    Loading developer API keys...
                  </div>
                ) : keys.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#FAF7F4] border border-dashed border-[#DCD5CB] text-center space-y-2">
                    <Key className="w-6 h-6 text-[#1B1F3B]/40 mx-auto" />
                    <p className="text-xs text-[#1B1F3B]/70">No API keys created yet. Generate one above to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {keys.map((k) => {
                      const usedPercentage = Math.min(100, (k.requests_today / k.daily_limit) * 100);
                      return (
                        <div
                          key={k.id}
                          className="p-4 rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#6B3074]/40 hover:shadow-xs transition"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-[#1B1F3B]">{k.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                                Active
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 font-mono text-xs text-[#1B1F3B]/75">
                              <span>{k.masked_key}</span>
                              <button
                                onClick={() => copyToClipboard(k.key_prefix, k.id)}
                                title="Copy Key Prefix"
                                className="p-1 hover:text-[#6B3074] rounded transition"
                              >
                                {copiedKeyId === k.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-[#1B1F3B]/40" />
                                )}
                              </button>
                            </div>
                            <p className="text-[11px] text-[#1B1F3B]/50">
                              Created on {new Date(k.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Visual Usage Meter */}
                          <div className="w-full md:w-56 space-y-1.5 bg-white p-2.5 rounded-lg border border-[#E5DFD7]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#1B1F3B]/70 font-medium">Daily Requests</span>
                              <span className="font-mono text-[#1B1F3B] font-semibold">
                                {k.requests_today} / {k.daily_limit}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[#EAE4DC] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  usedPercentage >= 90
                                    ? "bg-[#FF6B6B]"
                                    : usedPercentage >= 60
                                    ? "bg-amber-500"
                                    : "bg-[#6B3074]"
                                }`}
                                style={{ width: `${usedPercentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#1B1F3B]/50 font-mono">
                              <span>{k.remaining_today} remaining</span>
                              <span>Resets 00:00 UTC</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              className="p-2 rounded-lg text-[#1B1F3B]/40 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick-Start Code Snippets */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-[#6B3074]" />
                    <h3 className="text-xs font-bold text-[#1B1F3B] uppercase tracking-wider">
                      Developer Quick Start
                    </h3>
                  </div>
                  {/* Language Tabs */}
                  <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-[#FAF7F4] border border-[#E5DFD7] text-xs">
                    <button
                      onClick={() => setActiveCodeTab("curl")}
                      className={`px-3 py-1 rounded-md transition ${
                        activeCodeTab === "curl"
                          ? "bg-[#6B3074] text-white font-medium shadow-xs"
                          : "text-[#1B1F3B]/70 hover:text-[#1B1F3B]"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("python")}
                      className={`px-3 py-1 rounded-md transition ${
                        activeCodeTab === "python"
                          ? "bg-[#6B3074] text-white font-medium shadow-xs"
                          : "text-[#1B1F3B]/70 hover:text-[#1B1F3B]"
                      }`}
                    >
                      Python
                    </button>
                  </div>
                </div>

                <div className="relative rounded-xl bg-[#FAF7F4] border border-[#E5DFD7] p-4 font-mono text-xs overflow-x-auto text-[#1B1F3B]">
                  <button
                    onClick={() => {
                      const snippet = activeCodeTab === "curl" ? curlSnippet : pythonSnippet;
                      navigator.clipboard.writeText(snippet);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2000);
                    }}
                    className="absolute top-3 right-3 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white hover:bg-[#EAE4DC] text-[#1B1F3B] text-[11px] font-sans border border-[#DCD5CB] transition shadow-xs"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-semibold text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#1B1F3B]/60" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <pre className="pr-16 text-[#1B1F3B] leading-relaxed">
                    {activeCodeTab === "curl" ? curlSnippet : pythonSnippet}
                  </pre>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DFD7] bg-[#FAF7F4] flex items-center justify-between text-xs text-[#1B1F3B]/70">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Strict SHA-256 API Key hashing & automated daily quota tracking</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#EAE4DC] border border-[#DCD5CB] text-[#1B1F3B] font-medium transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
