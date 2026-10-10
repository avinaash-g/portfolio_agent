import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthModal from "./components/AuthModal";
import OnboardingWizard from "./components/OnboardingWizard";
import AgentProgress from "./components/AgentProgress";
import FollowUpQuestions from "./components/FollowUpQuestions";
import PlanReview from "./components/PlanReview";
import QualityScorecard from "./components/QualityScorecard";
import NLEditBox from "./components/NLEditBox";
import ManualEditor from "./components/ManualEditor";
import ProjectReorderModal from "./components/ProjectReorderModal";
import VersionHistoryModal from "./components/VersionHistoryModal";
import PortfolioPreview from "./components/PortfolioPreview";
import DeploymentBanner from "./components/DeploymentBanner";
import LandingPage from "./components/LandingPage";
import DeveloperApiModal from "./components/DeveloperApiModal";
import { api } from "./api";
import { SAMPLE_PROFILES } from "./utils/sampleData";
import { THEME_PRESETS } from "./utils/themeData";
import { ListOrdered, History, Sparkles } from "lucide-react";

function MainApp() {
  const { user, isAuthenticated } = useAuth();

  // Navigation State: 'landing' | 'form' | 'progress' | 'questions' | 'plan' | 'preview'
  const [currentView, setCurrentView] = useState("landing");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDeveloperApiOpen, setIsDeveloperApiOpen] = useState(false);

  // Form State
  const defaultSample = SAMPLE_PROFILES.software_developer;
  const [formData, setFormData] = useState({
    name: defaultSample.name,
    target_role: defaultSample.target_role,
    headline: defaultSample.headline,
    about: defaultSample.about,
    skills: [...defaultSample.skills],
    links: { ...defaultSample.links },
    experience: JSON.parse(JSON.stringify(defaultSample.experience || [])),
    education: JSON.parse(JSON.stringify(defaultSample.education || [])),
    achievements: JSON.parse(JSON.stringify(defaultSample.achievements || [])),
    projects: JSON.parse(JSON.stringify(defaultSample.projects || []))
  });

  // Dynamic Theme, Custom Color & Dynamic Layout State
  const [selectedTheme, setSelectedTheme] = useState("emerald");
  const [accentColor, setAccentColor] = useState("#18181b");
  const [selectedLayout, setSelectedLayout] = useState("modern_grid");
  const [customLayoutPrompt, setCustomLayoutPrompt] = useState("");
  const [agentStatus, setAgentStatus] = useState(null);

  // Sync user name when logged in
  useEffect(() => {
    if (user?.name && formData.name === "Alex Rivera") {
      setFormData((prev) => ({ ...prev, name: user.name }));
    }
  }, [user]);

  // Check agent status & Gemini configuration on mount
  useEffect(() => {
    api.getAgentStatus()
      .then((status) => setAgentStatus(status))
      .catch((err) => console.warn("Could not check agent status:", err));
  }, []);
  const [portfolioId, setPortfolioId] = useState(null);
  const [runId, setRunId] = useState(null);
  const [agentProgress, setAgentProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("Idle");
  const [agentState, setAgentState] = useState("INPUT");
  const [logs, setLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [portfolioContent, setPortfolioContent] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [template, setTemplate] = useState("clean");
  const [versions, setVersions] = useState([]);
  const [currentVersionId, setCurrentVersionId] = useState(null);
  const [deploymentUrl, setDeploymentUrl] = useState(null);
  const [deploymentProvider, setDeploymentProvider] = useState("Public Cloud");

  // UI Modals & Actions
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [lastEditSummary, setLastEditSummary] = useState("");
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Check agent status & Gemini configuration on mount
  useEffect(() => {
    api.getAgentStatus()
      .then((status) => setAgentStatus(status))
      .catch((err) => console.warn("Could not check agent status:", err));
  }, []);

  // Helper to apply state snapshots safely
  const applyRunSnapshot = (data, isLiveEvent = false) => {
    if (!data) return;

    if (data.stage) setCurrentStage(data.stage);
    if (data.progress !== undefined) setAgentProgress(data.progress);
    if (data.state) setAgentState(data.state);

    if (data.logs && Array.isArray(data.logs)) {
      setLogs(data.logs);
    } else if (data.message) {
      setLogs((prev) => {
        const exists = prev.some(l => l.message === data.message && l.stage === data.stage);
        if (exists) return prev;
        return [...prev, { stage: data.stage, message: data.message, timestamp: data.timestamp }];
      });
    }

    if (data.state === "NEEDS_INFO" && data.payload?.questions) {
      setQuestions(data.payload.questions);
      setCurrentView("questions");
    }

    if (data.state === "PLANNED" && data.payload?.plan) {
      setPlan(data.payload.plan);
    }

    if (data.state === "READY" || data.state === "COMPLETED") {
      setAgentProgress(100);
      setCurrentStage("Completed");
      setAgentState("READY");
      if (data.payload?.content) setPortfolioContent(data.payload.content);
      if (data.payload?.quality_report) setQualityReport(data.payload.quality_report);
      if (data.payload?.version_id) setCurrentVersionId(data.payload.version_id);
      setIsGenerating(false);
      refreshPortfolio(portfolioId);
      setTimeout(() => {
        setCurrentView("preview");
      }, 700);
    }
  };

  // Auto-connect SSE & Sync State when runId is set
  useEffect(() => {
    if (!portfolioId || !runId) return;

    // Fast initial status snapshot to avoid race conditions
    api.getRunStatus(runId)
      .then((snap) => {
        if (snap) {
          applyRunSnapshot(snap);
        }
      })
      .catch((err) => console.warn("Initial status fetch error:", err));

    const cleanup = api.connectSSE(
      portfolioId,
      runId,
      (eventData) => {
        const { event, data } = eventData;
        if ((event === "STAGE_UPDATE" || event === "CURRENT_STATE") && data) {
          applyRunSnapshot(data, event === "STAGE_UPDATE");
        }
      },
      (err) => {
        console.warn("SSE connection closed:", err);
      }
    );

    return cleanup;
  }, [portfolioId, runId]);

  // Load active portfolio data
  const refreshPortfolio = async (id) => {
    if (!id) return;
    try {
      const data = await api.getPortfolio(id);
      if (data.theme_id) setSelectedTheme(data.theme_id);
      if (data.primary_color) setAccentColor(data.primary_color);
      if (data.layout_id) setSelectedLayout(data.layout_id);
      if (data.custom_layout_prompt) setCustomLayoutPrompt(data.custom_layout_prompt);
      if (data.current_version) {
        setPortfolioContent(data.current_version.content);
        if (data.current_version.quality_report) {
          setQualityReport(data.current_version.quality_report);
        }
        setCurrentVersionId(data.current_version.id);
      }
      if (data.deployment_url) {
        setDeploymentUrl(data.deployment_url);
      }
      const vList = await api.getVersions(id);
      setVersions(vList);
    } catch (err) {
      console.error("Error refreshing portfolio:", err);
    }
  };

  // Theme & Layout update handlers
  const handleThemeChange = async (newThemeId) => {
    setSelectedTheme(newThemeId);
    const defaultColor = THEME_PRESETS[newThemeId]?.primaryColor;
    const newAccent = defaultColor || accentColor;
    if (defaultColor) {
      setAccentColor(defaultColor);
    }
    if (portfolioId) {
      try {
        await api.updateTheme(portfolioId, { theme_id: newThemeId, primary_color: newAccent });
      } catch (err) {
        console.error("Failed to update theme on server:", err);
      }
    }
  };

  const handleLayoutChange = async (newLayoutId) => {
    setSelectedLayout(newLayoutId);
    if (portfolioId) {
      try {
        await api.updateTheme(portfolioId, { layout_id: newLayoutId });
        await refreshPortfolio(portfolioId);
      } catch (err) {
        console.error("Failed to update layout on server:", err);
      }
    }
  };

  const handleAccentColorChange = async (newColor) => {
    setAccentColor(newColor);
    if (portfolioId) {
      try {
        await api.updateTheme(portfolioId, { theme_id: selectedTheme, primary_color: newColor });
      } catch (err) {
        console.error("Failed to update accent color on server:", err);
      }
    }
  };

  // 1. Save Draft
  const handleSaveDraft = async () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }
    try {
      await api.updateProfile({
        headline: formData.headline,
        about: formData.about,
        target_role: formData.target_role,
        skills: formData.skills,
        education: formData.education,
        experience: formData.experience,
        achievements: formData.achievements,
        certifications: [],
        links: formData.links
      });
      alert("Profile draft saved successfully!");
    } catch (err) {
      alert("Error saving draft: " + err.message);
    }
  };

  // 2. Generate Portfolio (Starts Agent Pipeline)
  const handleGenerate = async () => {
    if (!isAuthenticated) {
      setIsAuthOpen(true);
      return;
    }

    setIsGenerating(true);
    setLogs([]);
    setAgentProgress(5);
    setCurrentStage("Initializing");
    setCurrentView("progress");

    try {
      // 1. Sync Profile
      await api.updateProfile({
        headline: formData.headline,
        about: formData.about,
        target_role: formData.target_role,
        skills: formData.skills,
        education: formData.education,
        experience: formData.experience,
        achievements: formData.achievements,
        certifications: [],
        links: formData.links
      });

      // 2. Sync Projects
      const existingProjects = await api.getProjects();
      for (const p of existingProjects) {
        await api.deleteProject(p.id);
      }
      for (const p of formData.projects) {
        await api.createProject({
          name: p.name,
          description: p.description,
          technologies: Array.isArray(p.technologies) ? p.technologies : [p.technologies],
          role: p.role,
          github_url: p.github_url,
          demo_url: p.demo_url,
          outcomes: p.outcomes,
          is_featured: p.is_featured ?? true
        });
      }

      // 3. Create Portfolio & Start Run with Layout & Theme Preferences
      const portfolio = await api.createPortfolio({
        title: `${formData.name}'s ${formData.target_role} Portfolio`,
        target_role: formData.target_role,
        template_id: template,
        layout_id: selectedLayout,
        custom_layout_prompt: customLayoutPrompt || undefined,
        theme_id: selectedTheme,
        primary_color: accentColor
      });

      setPortfolioId(portfolio.id);
      if (portfolio.latest_run) {
        setRunId(portfolio.latest_run.id);

        // Immediate snapshot fetch in case generation finishes swiftly
        try {
          const initialStatus = await api.getRunStatus(portfolio.latest_run.id);
          if (initialStatus) {
            applyRunSnapshot(initialStatus);
          }
        } catch (snapErr) {
          console.warn("Initial status fetch error:", snapErr);
        }
      }
    } catch (err) {
      console.error("Pipeline initiation failed:", err);
      alert("Failed to start agent: " + err.message);
      setIsGenerating(false);
      setCurrentView("form");
    }
  };

  // 3. Submit Follow-up Answers
  const handleSubmitAnswers = async (answersPayload, generateAnyway) => {
    if (!runId) return;
    try {
      setCurrentView("progress");
      setCurrentStage("Resuming with Answers");
      await api.submitAnswers(runId, answersPayload, generateAnyway);
    } catch (err) {
      alert("Error submitting answers: " + err.message);
    }
  };

  // 4. Natural Language Refinement
  const handleApplyNLEdit = async (instruction) => {
    if (!portfolioId) return;
    setIsEditing(true);
    try {
      const res = await api.nlEdit(portfolioId, instruction);
      setPortfolioContent(res.content);
      setQualityReport(res.quality_report);
      setCurrentVersionId(res.id);
      setLastEditSummary(res.change_summary);
      await refreshPortfolio(portfolioId);
    } catch (err) {
      alert("Error applying edit: " + err.message);
    } finally {
      setIsEditing(false);
    }
  };

  // 5. Manual Update
  const handleSaveManual = async (updatedContent) => {
    if (!portfolioId) return;
    setIsSavingManual(true);
    try {
      const res = await api.manualUpdate(portfolioId, updatedContent);
      setPortfolioContent(res.content);
      setQualityReport(res.quality_report);
      setCurrentVersionId(res.id);
      await refreshPortfolio(portfolioId);
    } catch (err) {
      alert("Error saving manual edits: " + err.message);
    } finally {
      setIsSavingManual(false);
    }
  };

  // 6. Project Reordering
  const handleSaveProjectOrder = async (orderPayload) => {
    if (!portfolioId) return;
    try {
      const res = await api.reorderProjects(portfolioId, orderPayload);
      setPortfolioContent(res.content);
      setCurrentVersionId(res.id);
      await refreshPortfolio(portfolioId);
    } catch (err) {
      alert("Error reordering projects: " + err.message);
    }
  };

  // 7. Restore Version
  const handleRestoreVersion = async (versionId) => {
    if (!portfolioId) return;
    try {
      await api.restoreVersion(portfolioId, versionId);
      await refreshPortfolio(portfolioId);
    } catch (err) {
      alert("Error restoring version: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3EFEA] text-[#1B1F3B]">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        portfolioId={portfolioId}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDeveloperApi={() => setIsDeveloperApiOpen(true)}
        agentStatus={agentStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#F3EFEA]">
        {currentView === "landing" && (
          <LandingPage
            onLaunchStudio={() => setCurrentView("form")}
            onOpenApiKeyModal={() => setIsDeveloperApiOpen(true)}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {currentView === "form" && (
          <OnboardingWizard
            formData={formData}
            setFormData={setFormData}
            onSaveDraft={handleSaveDraft}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            selectedLayout={selectedLayout}
            setSelectedLayout={setSelectedLayout}
            customLayoutPrompt={customLayoutPrompt}
            setCustomLayoutPrompt={setCustomLayoutPrompt}
            agentStatus={agentStatus}
          />
        )}

        {currentView === "progress" && (
          <AgentProgress
            currentStage={currentStage}
            progress={agentProgress}
            logs={logs}
            state={agentState}
            questionsCount={questions.length}
            qualityScore={qualityReport?.score}
            onGoToQuestions={() => setCurrentView("questions")}
            onGoToStudio={() => setCurrentView("preview")}
          />
        )}

        {currentView === "questions" && (
          <FollowUpQuestions
            questions={questions}
            onSubmitAnswers={handleSubmitAnswers}
            isSubmitting={isGenerating}
          />
        )}

        {currentView === "plan" && (
          <PlanReview
            plan={plan}
            onApprove={() => setCurrentView("progress")}
            isApproving={isGenerating}
          />
        )}

        {currentView === "preview" && (
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5 min-h-[calc(100vh-4rem)]">
            
            {/* Recruiter-Ready Autonomous Live Deployment Agent Prompt Banner */}
            <DeploymentBanner
              portfolioId={portfolioId}
              qualityScore={qualityReport?.score || 95}
              initialDeploymentUrl={deploymentUrl}
              initialProvider={deploymentProvider}
              onDownloadZip={() => {
                const exportUrl = api.getExportUrl(portfolioId, template, selectedTheme, accentColor, selectedLayout);
                const link = document.createElement("a");
                link.href = exportUrl;
                link.setAttribute("download", `portfolio_${selectedLayout}_${selectedTheme}.zip`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onDeployed={(deployResult) => {
                if (deployResult?.url) setDeploymentUrl(deployResult.url);
                if (deployResult?.provider) setDeploymentProvider(deployResult.provider);
                refreshPortfolio(portfolioId);
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Control Column (Studio side panel) */}
              <div className="lg:col-span-5 space-y-5 overflow-y-auto max-h-[calc(100vh-14rem)] pr-1">
                
                {/* Top Quick Actions Bar */}
                <div className="flex items-center justify-between bg-white border border-[#E5DFD7] rounded-xl p-3 shadow-soft">
                  <span className="text-xs font-bold text-[#1B1F3B]">Workspace Controls</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsReorderOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#DCD5CB] text-xs font-semibold text-[#1B1F3B] transition shadow-xs"
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-[#6B3074]" />
                      <span>Reorder</span>
                    </button>
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F4] hover:bg-[#EAE4DC] border border-[#DCD5CB] text-xs font-semibold text-[#1B1F3B] transition shadow-xs"
                    >
                      <History className="w-3.5 h-3.5 text-[#6B3074]" />
                      <span>Versions ({versions.length})</span>
                    </button>
                  </div>
                </div>

                {/* Quality Scorecard (0-100 rubric) */}
                <QualityScorecard qualityReport={qualityReport} />

                {/* Natural Language Refinement Chat Box */}
                <NLEditBox
                  onApplyEdit={handleApplyNLEdit}
                  isEditing={isEditing}
                  lastEditSummary={lastEditSummary}
                />

                {/* Direct Content Editor */}
                <ManualEditor
                  content={portfolioContent}
                  onSaveManual={handleSaveManual}
                  isSaving={isSavingManual}
                />

              </div>

              {/* Right Interactive Live Preview Column */}
              <div className="lg:col-span-7 flex flex-col h-[85vh] lg:h-[calc(100vh-14rem)] sticky top-20">
                <PortfolioPreview
                  portfolioId={portfolioId}
                  template={template}
                  onTemplateChange={(newTmpl) => setTemplate(newTmpl)}
                  selectedTheme={selectedTheme}
                  onThemeChange={handleThemeChange}
                  accentColor={accentColor}
                  onAccentColorChange={handleAccentColorChange}
                  selectedLayout={selectedLayout}
                  onLayoutChange={handleLayoutChange}
                  onDeployClick={() => {
                    const deployBanner = document.querySelector("#deploy-banner");
                    if (deployBanner) deployBanner.scrollIntoView({ behavior: "smooth" });
                  }}
                />
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <DeveloperApiModal
        isOpen={isDeveloperApiOpen}
        onClose={() => setIsDeveloperApiOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <ProjectReorderModal
        isOpen={isReorderOpen}
        onClose={() => setIsReorderOpen(false)}
        content={portfolioContent}
        onSaveOrder={handleSaveProjectOrder}
      />

      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        versions={versions}
        currentVersionId={currentVersionId}
        onRestoreVersion={handleRestoreVersion}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
