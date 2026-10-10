export const CURATED_THEMES = [
  {
    id: "luxury_saas",
    name: "Luxury Void & Cobalt",
    tagline: "4-Color High-Tech Luxury",
    primary: "#2563EB",
    accent: "#7C3AED",
    mode: "dark",
    bg_color: "#0B0F19",
    surface_color: "#111827",
    border_color: "rgba(255, 255, 255, 0.1)",
    border: "border-white/10",
    bgBadge: "bg-violet-950/80 text-violet-300 border-violet-800",
    description: "Deep Void Slate canvas, Electric Cobalt brand accents, Luminous Amethyst glows, and Alabaster Zinc micro-typography."
  },
  {
    id: "emerald",
    name: "Editorial Ink",
    tagline: "Monochrome & Sharp",
    primary: "#18181b",
    mode: "light",
    bg_color: "#ffffff",
    surface_color: "#fafafa",
    border_color: "#e4e4e7",
    border: "border-zinc-200",
    bgBadge: "bg-zinc-100 text-zinc-900 border-zinc-200",
    description: "Crisp editorial white layout, razor-sharp typography, and restrained ink black accents."
  },
  {
    id: "indigo",
    name: "Modern Slate",
    tagline: "Subtle & Professional",
    primary: "#334155",
    mode: "light",
    bg_color: "#ffffff",
    surface_color: "#f8fafc",
    border_color: "#e2e8f0",
    border: "border-slate-200",
    bgBadge: "bg-slate-100 text-slate-800 border-slate-200",
    description: "Refined engineering portfolio with deep slate typography and clean neutral surfaces."
  },
  {
    id: "amber",
    name: "Warm Editorial",
    tagline: "Stone & Craft",
    primary: "#78716c",
    mode: "light",
    bg_color: "#fdfdfc",
    surface_color: "#f7f7f5",
    border_color: "#e7e5e4",
    border: "border-stone-200",
    bgBadge: "bg-stone-100 text-stone-800 border-stone-200",
    description: "Natural off-white canvas, stone accents, and high-contrast editorial typography."
  },
  {
    id: "cyber",
    name: "Minimalist Pine",
    tagline: "Subtle Botanical",
    primary: "#166534",
    mode: "light",
    bg_color: "#ffffff",
    surface_color: "#f4f7f4",
    border_color: "#dcfce7",
    border: "border-zinc-200",
    bgBadge: "bg-emerald-50 text-emerald-900 border-emerald-200",
    description: "Crisp white layout accented with restrained forest green and subtle hairline dividers."
  },
  {
    id: "rose",
    name: "Deep Navy",
    tagline: "Studio & Code",
    primary: "#1e3a8a",
    mode: "light",
    bg_color: "#ffffff",
    surface_color: "#f8fafc",
    border_color: "#e2e8f0",
    border: "border-zinc-200",
    bgBadge: "bg-blue-50 text-blue-900 border-blue-200",
    description: "High-contrast clean white surface with deep midnight blue details and minimal flat cards."
  }
];

export const PRESET_ACCENT_COLORS = [
  "#2563EB", // Electric Cobalt
  "#7C3AED", // Luminous Amethyst
  "#18181b", // Ink Black
  "#334155", // Slate
  "#166534", // Forest Green
  "#1e3a8a", // Midnight Navy
  "#78716c", // Warm Stone
  "#475569", // Neutral Slate
  "#0f766e", // Muted Teal
  "#b45309", // Warm Amber
  "#9f1239", // Deep Burgundy
  "#3b82f6"  // Clean Blue
];

export const THEME_PRESETS = CURATED_THEMES.reduce((acc, t) => {
  acc[t.id] = { ...t, primaryColor: t.primary };
  return acc;
}, {});

export const CURATED_LAYOUTS = [
  {
    id: "modern_grid",
    name: "Modern Grid / Bento",
    tagline: "Dynamic & Visual",
    badge: "Asymmetrical Bento",
    recommendedFor: "Full-Stack & Frontend Developers",
    description: "Hero banner with an asymmetrical bento grid for projects, skill badges, and quick stats.",
    iconName: "LayoutGrid"
  },
  {
    id: "case_study_story",
    name: "Chronological Case-Study Story",
    tagline: "Narrative-First Architecture",
    badge: "STAR Storytelling",
    recommendedFor: "Mid, Senior & Staff Engineers",
    description: "Narrative-first structure (Hero -> Deep Dive Case Studies with problem/solution cards -> Timeline of Experience/Education -> Skills).",
    iconName: "BookOpen"
  },
  {
    id: "sidebar_split",
    name: "Minimalist Sidebar / Split-Screen",
    tagline: "High-Focus Split Screen",
    badge: "Fixed Left Sidebar",
    recommendedFor: "Product Engineers & Builders",
    description: "Fixed left sidebar (Name, role, bio, links, contact) with a scrollable right pane (projects and categorized skills).",
    iconName: "Columns"
  },
  {
    id: "terminal_minimalist",
    name: "Executive / Terminal Minimalist",
    tagline: "Monospace Systems Aesthetic",
    badge: "Monospace CLI",
    recommendedFor: "Backend, Systems & DevOps Engineers",
    description: "Typography-focused, compact monospace/terminal layout suited for systems and backend developers.",
    iconName: "Terminal"
  }
];
