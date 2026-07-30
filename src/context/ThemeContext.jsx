import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Enterprise Light Mode only — no dark mode toggle
  return (
    <ThemeContext.Provider value={{ isDarkMode: false }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
