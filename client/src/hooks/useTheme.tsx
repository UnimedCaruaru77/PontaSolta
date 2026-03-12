import { createContext, useContext, useEffect, useState } from "react";

export type ThemeId =
  | "neon-black"
  | "midnight-navy"
  | "slate-coral"
  | "ocean-depth"
  | "forest-executive"
  | "carbon-ice"
  | "royal-amethyst"
  | "unimed";

export interface ThemeInfo {
  id: ThemeId;
  label: string;
  description: string;
  dark: boolean;
  colors: {
    bg: string;
    primary: string;
    accent: string;
    sidebar: string;
  };
}

export const THEMES: ThemeInfo[] = [
  {
    id: "neon-black",
    label: "Neon Black",
    description: "Ciberpunk — padrão do sistema",
    dark: true,
    colors: { bg: "#080808", primary: "#00ffff", accent: "#00ff00", sidebar: "#0d0d0d" },
  },
  {
    id: "midnight-navy",
    label: "Midnight Navy",
    description: "Corporativo Premium — navy e ouro",
    dark: true,
    colors: { bg: "#0c1128", primary: "#f5a623", accent: "#b87a2e", sidebar: "#070d1e" },
  },
  {
    id: "slate-coral",
    label: "Slate & Coral",
    description: "Moderno e Acolhedor — ardósia e coral",
    dark: true,
    colors: { bg: "#141926", primary: "#e05252", accent: "#a33d3d", sidebar: "#0e1420" },
  },
  {
    id: "ocean-depth",
    label: "Ocean Depth",
    description: "Tecnológico Suave — petróleo e ciano",
    dark: true,
    colors: { bg: "#071620", primary: "#00b4d8", accent: "#009fc0", sidebar: "#040e16" },
  },
  {
    id: "forest-executive",
    label: "Forest Executive",
    description: "Verde Profissional — musgo e lima",
    dark: true,
    colors: { bg: "#091309", primary: "#8bc34a", accent: "#4a7a20", sidebar: "#050d05" },
  },
  {
    id: "carbon-ice",
    label: "Carbon & Ice",
    description: "Minimalista Limpo — carvão e azul-elétrico",
    dark: true,
    colors: { bg: "#0e1016", primary: "#3b82f6", accent: "#1d4ed8", sidebar: "#090b10" },
  },
  {
    id: "royal-amethyst",
    label: "Royal Amethyst",
    description: "Premium Exclusivo — violeta e ametista",
    dark: true,
    colors: { bg: "#120a1f", primary: "#a855f7", accent: "#7e22ce", sidebar: "#0a0614" },
  },
  {
    id: "unimed",
    label: "Unimed",
    description: "Cores Unimed — verde corporativo claro",
    dark: false,
    colors: { bg: "#f5f5f5", primary: "#00954a", accent: "#f58a07", sidebar: "#007a3d" },
  },
];

const STORAGE_KEY = "ponta-solta-theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  themes: ThemeInfo[];
  currentTheme: ThemeInfo;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "neon-black",
  setTheme: () => {},
  themes: THEMES,
  currentTheme: THEMES[0],
});

function applyThemeToDOM(t: ThemeId) {
  const html = document.documentElement;
  const info = THEMES.find(th => th.id === t) ?? THEMES[0];
  if (t === "neon-black") {
    html.removeAttribute("data-theme");
  } else {
    html.setAttribute("data-theme", t);
  }
  if (info.dark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = (localStorage.getItem(STORAGE_KEY) as ThemeId) || "neon-black";
      applyThemeToDOM(saved);
      return saved;
    } catch {
      applyThemeToDOM("neon-black");
      return "neon-black";
    }
  });

  useEffect(() => {
    applyThemeToDOM(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = (t: ThemeId) => setThemeState(t);
  const currentTheme = THEMES.find(th => th.id === theme) ?? THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
