import { createContext, useContext } from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: string
  storageKey?: string
}

type ThemeProviderState = {
  theme: string
  setTheme: (theme: string) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function CustomThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const { theme, setTheme: setNextTheme } = useNextTheme()

  const value = {
    theme: theme || defaultTheme,
    setTheme: setNextTheme
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={props.defaultTheme} storageKey={props.storageKey || "theme"} enableSystem>
      <CustomThemeProvider {...props}>{children}</CustomThemeProvider>
    </NextThemesProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
