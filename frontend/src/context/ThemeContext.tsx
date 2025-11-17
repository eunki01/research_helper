import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { SearchMode } from '../types/search';

interface ThemeContextType {
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
  theme: ThemeConfig;
}

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  background: string;
  text: string;
  name: string;
}

const themes: Record<SearchMode, ThemeConfig> = {
  external: {
    primary: '#059669', // green-600
    secondary: '#10B981', // emerald-500
    accent: '#D1FAE5', // emerald-100
    border: '#10B981', // emerald-500
    background: '#ECFDF5', // emerald-50
    text: '#064E3B', // emerald-900
    name: '외부 검색'
  },
  internal: {
    primary: '#2563EB', // blue-600
    secondary: '#3B82F6', // blue-500
    accent: '#DBEAFE', // blue-100
    border: '#3B82F6', // blue-500
    background: '#EFF6FF', // blue-50
    text: '#1E3A8A', // blue-900
    name: '내부 검색'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: SearchMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'external'
}) => {
  const [searchMode, setSearchMode] = useState<SearchMode>(initialMode);
  const [theme, setTheme] = useState<ThemeConfig>(themes[initialMode]);

  // 검색 모드 변경 시 테마 업데이트
  useEffect(() => {
    setTheme(themes[searchMode]);
  }, [searchMode]);

  const value: ThemeContextType = useMemo(() => ({
    searchMode,
    setSearchMode,
    theme
  }), [searchMode, setSearchMode, theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
