'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface MobileNavContextValue {
  open: () => void;
}

const MobileNavContext = createContext<MobileNavContextValue>({ open: () => {} });

export const useMobileNav = () => useContext(MobileNavContext);

export const MobileNavProvider = ({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) => {
  return (
    <MobileNavContext.Provider value={{ open: onOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
};
