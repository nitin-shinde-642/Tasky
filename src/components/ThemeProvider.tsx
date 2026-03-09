import { createContext, useContext, useEffect, useState } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

type AccentColor = "zinc" | "red" | "rose" | "orange" | "green" | "blue" | "yellow" | "violet"

type ThemeProviderState = {
  theme: string
  setTheme: (theme: string) => void
  accent: AccentColor
  setAccent: (accent: AccentColor) => void
  opacity: number
  setOpacity: (opacity: number) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  accent: "zinc",
  setAccent: () => null,
  opacity: 1, // 1 is fully opaque, 0.5 is 50% transparent
  setOpacity: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function CustomThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "tasklyn-ui-theme",
}: ThemeProviderProps) {
  const { theme, setTheme: setNextTheme } = useNextTheme()
  
  // Custom states that extend next-themes
  const [accent, setAccentState] = useState<AccentColor>(() => {
    return (localStorage.getItem(`${storageKey}-accent`) as AccentColor) || "zinc"
  })

  const [opacity, setOpacityState] = useState<number>(() => {
    const val = localStorage.getItem(`${storageKey}-opacity`)
    return val ? parseFloat(val) : 1
  })

  // Set the theme class and accent class on the document root
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all old accents
    const accentNames = ["zinc", "red", "rose", "orange", "green", "blue", "yellow", "violet"].map(a => `theme-${a}`)
    root.classList.remove(...accentNames)
    
    // Add new accent
    root.classList.add(`theme-${accent}`)
  }, [accent])

  // Sync native window opacity when it changes
  useEffect(() => {
    // We do NOT use win.setOpacity() here because it turns the entire window ghost-like (including text).
    // Instead we rely on Electron's native backgroundMaterial ('acrylic') and we just modify the CSS
    // background alpha to allow the native OS blur to shine through behind the DOM.
    const root = window.document.documentElement;
    if (opacity < 1) {
      // Use proper HSL syntax for the Tailwind CSS variables
      root.style.backgroundColor = `hsl(var(--background) / ${opacity})`;
      root.style.backdropFilter = 'blur(16px)'; // Fallback for browsers
    } else {
      root.style.backgroundColor = ''; 
      root.style.backdropFilter = '';
    }
  }, [opacity]);

  const setAccent = (newAccent: AccentColor) => {
    localStorage.setItem(`${storageKey}-accent`, newAccent)
    setAccentState(newAccent)
  }

  const setOpacity = (newOpacity: number) => {
    localStorage.setItem(`${storageKey}-opacity`, newOpacity.toString())
    setOpacityState(newOpacity)
  }

  const value = {
    theme: theme || defaultTheme,
    setTheme: setNextTheme,
    accent,
    setAccent,
    opacity,
    setOpacity
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={props.defaultTheme} enableSystem>
      <CustomThemeProvider {...props}>{children}</CustomThemeProvider>
    </NextThemesProvider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
