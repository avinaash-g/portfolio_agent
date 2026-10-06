import React, { useState } from "react";
import { 
  Monitor, Tablet, Smartphone, ExternalLink, Download, 
  RotateCw, Moon, Sun, ShieldCheck, Palette, Sparkles, Rocket,
  LayoutGrid, BookOpen, Columns, Terminal
} from "lucide-react";
import { api } from "../api";
import { CURATED_THEMES, PRESET_ACCENT_COLORS, CURATED_LAYOUTS } from "../utils/themeData";

export default function PortfolioPreview({ 
  portfolioId, 
  template = "clean", 
  onTemplateChange,
  selectedTheme = "emerald",
  onThemeChange,
  accentColor = "#18181b",
  onAccentColorChange,
  selectedLayout = "modern_grid",
  onLayoutChange,
  onDeployClick
}) {
  const [device, setDevice] = useState("desktop");
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [isExporting, setIsExporting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const previewUrl = api.getPreviewUrl(portfolioId, template, selectedTheme, accentColor, selectedLayout);

  const reloadIframe = () => {
    setIframeKey(Date.now());
  };

  const handleExportZip = async () => {
    setIsExporting(true);
    try {
      const exportUrl = api.getExportUrl(portfolioId, template, selectedTheme, accentColor, selectedLayout);
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", `portfolio_${selectedLayout}_${selectedTheme}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export static zip: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const getContainerWidth = () => {
    if (device === "mobile") return "max-w-[375px]";
    if (device === "tablet") return "max-w-[768px]";
    return "w-full";
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
      
      {/* Top Controls Toolbar */}
      <div className="px-4 py-3 bg-white border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
        
        {/* Device Switcher */}
        <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200/80">
          <button
            onClick={() => setDevice("desktop")}
            title="Desktop view (100%)"
            className={`p-1.5 rounded-md transition ${
              device === "desktop" ? "bg-white text-zinc-900 shadow-2xs font-semibold" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice("tablet")}
            title="Tablet view (768px)"
            className={`p-1.5 rounded-md transition ${
              device === "tablet" ? "bg-white text-zinc-900 shadow-2xs font-semibold" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDevice("mobile")}
            title="Mobile phone view (375px)"
            className={`p-1.5 rounded-md transition ${
              device === "mobile" ? "bg-white text-zinc-900 shadow-2xs font-semibold" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Dynamic Layout Architecture Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-medium text-zinc-500 hidden xl:inline">Layout:</span>
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-xs gap-1">
            {CURATED_LAYOUTS.map((lay) => (
              <button
                key={lay.id}
                onClick={() => onLayoutChange && onLayoutChange(lay.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  selectedLayout === lay.id
                    ? "bg-white text-zinc-950 shadow-2xs font-bold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
                title={lay.description}
              >
                {lay.id === "modern_grid" && "Bento"}
                {lay.id === "case_study_story" && "Story"}
                {lay.id === "sidebar_split" && "Sidebar"}
                {lay.id === "terminal_minimalist" && "Terminal"}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Curated Theme Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-medium text-zinc-500 hidden 2xl:inline">Theme:</span>
          <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200/80 text-xs gap-1">
            {CURATED_THEMES.map((th) => (
              <button
                key={th.id}
                onClick={() => {
                  if (onThemeChange) onThemeChange(th.id);
                  if (onAccentColorChange) onAccentColorChange(th.primary);
                  if (onTemplateChange) onTemplateChange("clean");
                }}
                className={`px-2 py-1 rounded-md flex items-center space-x-1.5 font-medium transition ${
                  selectedTheme === th.id
                    ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
                title={th.description}
              >
                <span className="w-2 h-2 rounded-full border border-black/10" style={{ backgroundColor: th.primary }}></span>
                <span className="text-[11px]">{th.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Accent Color & Controls */}
        <div className="flex items-center space-x-2">
          
          {/* Custom Color Button */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 transition flex items-center gap-1.5 text-xs font-medium"
              title="Customize Primary Accent Color"
            >
              <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: accentColor }}></span>
              <Palette className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {/* Color Picker Flyout */}
            {showColorPicker && (
              <div className="absolute right-0 top-10 z-50 p-3 bg-white border border-zinc-200 rounded-xl shadow-lg space-y-3 w-56">
                <div className="text-xs font-semibold text-zinc-800 flex items-center justify-between">
                  <span>Custom Accent</span>
                  <span className="text-[10px] font-mono text-zinc-500">{accentColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => onAccentColorChange && onAccentColorChange(e.target.value)}
                    className="w-7 h-7 rounded-md bg-transparent cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => onAccentColorChange && onAccentColorChange(e.target.value)}
                    className="flex-1 px-2 py-1 bg-zinc-50 border border-zinc-200 rounded text-xs font-mono text-zinc-900"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100">
                  {PRESET_ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onAccentColorChange && onAccentColorChange(c)}
                      className="w-4 h-4 rounded-full border border-zinc-300 hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={reloadIframe}
            title="Reload Preview"
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open preview in new tab"
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 transition inline-flex items-center"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Deploy Live Button */}
          {onDeployClick && (
            <button
              onClick={onDeployClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-2xs"
              title="Deploy Live to Web"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deploy Live</span>
            </button>
          )}

          {/* Static ZIP Export Button */}
          <button
            onClick={handleExportZip}
            disabled={isExporting}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExporting ? "Exporting..." : "ZIP"}</span>
          </button>
        </div>

      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-zinc-100/70 p-3 sm:p-4 flex items-center justify-center overflow-auto">
        <div
          className={`${getContainerWidth()} h-full transition-all duration-300 rounded-xl overflow-hidden border border-zinc-200/90 shadow-2xs bg-white flex flex-col`}
          style={{ minHeight: "680px" }}
        >
          <iframe
            key={`${iframeKey}-${template}-${selectedTheme}-${accentColor}`}
            src={previewUrl}
            title="Portfolio Live Preview"
            className="w-full h-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="px-4 py-2 bg-white border-t border-zinc-200 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span>Clean Editorial Theme: <strong className="text-zinc-800 capitalize">{selectedTheme}</strong> &bull; Accent: <code className="text-zinc-800">{accentColor}</code> &bull; Self-contained build</span>
        </div>
        <span className="font-mono text-zinc-400 hidden sm:inline">Device: {device}</span>
      </div>

    </div>
  );
}
