import React, { createContext, useContext, useState, useCallback } from 'react';

interface LogoContextType {
  logoVersion: number;
  refreshLogo: () => void;
}

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoVersion, setLogoVersion] = useState(0);

  const refreshLogo = useCallback(() => {
    setLogoVersion(prev => prev + 1);
  }, []);

  return (
    <LogoContext.Provider value={{ logoVersion, refreshLogo }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    return {
      logoVersion: 0,
      refreshLogo: () => {}
    };
  }
  return context;
};
