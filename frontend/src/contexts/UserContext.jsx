// frontend/src/contexts/UserContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenVersion, setTokenVersion] = useState(0); // Нова версія токенів

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/secure/profile');
      setUser({
        ...data,
        role: (data.role || 'student').toLowerCase(),
        avatar: data.avatar ? `${data.avatar}?${Date.now()}` : null
      });
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    localStorage.clear();
    setUser(null);
    setTokenVersion(prev => prev + 1); // Форсуємо оновлення
  };

  const forceRefresh = () => {
    setTokenVersion(prev => prev + 1);
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [tokenVersion]); // Залежність від версії токена

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      refreshUser: fetchUser,
      logout: handleLogout,
      forceRefresh // Додаємо метод для примусового оновлення
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);