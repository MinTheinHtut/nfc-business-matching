import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    apiRequest('/auth/me')
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((error) => {
        setUser(null);
        if (error.status !== 401) console.error(error);
      })
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(username, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Confirm that the browser retained the backend session cookie before the
    // authenticated UI is rendered (important for cross-site Safari behavior).
    const { user: verifiedUser } = await apiRequest('/auth/me');
    setUser(verifiedUser);
    return verifiedUser;
  }

  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
