import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAuthenticated } from './authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    isAuthenticated().then(setAuthed);
  }, []);

  return (
    <AuthContext.Provider value={{ authed, setAuthed }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
