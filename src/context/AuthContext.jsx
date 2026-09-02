import { useState, useCallback } from 'react';
import { AuthContext } from './AuthContext';

const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@absu.edu.ng',
    password: 'admin123',
    first_name: 'Chinwe',
    last_name: 'Okafor',
    role: 'admin',
    matric_number: null,
    phone: '08012345678',
  },
  {
    id: '2',
    email: 'librarian@absu.edu.ng',
    password: 'lib123',
    first_name: 'David',
    last_name: 'Nwosu',
    role: 'librarian',
    matric_number: null,
    phone: '08087654321',
  },
  {
    id: '3',
    email: 'student@absu.edu.ng',
    password: 'stud123',
    first_name: 'Adaeze',
    last_name: 'Uche',
    role: 'student',
    matric_number: 'ABSU/2021/001',
    phone: '08011223344',
  },
];

const stripPassword = (user) => {
  const safe = { ...user };
  delete safe.password;
  return safe;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('absu_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((email, password) => {
    const found = MOCK_USERS.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    const safeUser = stripPassword(found);
    setUser(safeUser);
    localStorage.setItem('absu_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, []);

  const register = useCallback((userData) => {
    const exists = MOCK_USERS.find((u) => u.email === userData.email);
    if (exists) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser = {
      id: String(MOCK_USERS.length + 1),
      ...userData,
      role: 'student',
    };
    MOCK_USERS.push(newUser);
    const safeUser = stripPassword(newUser);
    setUser(safeUser);
    localStorage.setItem('absu_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('absu_user');
  }, []);

  const changePassword = useCallback((currentPassword, newPassword) => {
    const record = MOCK_USERS.find((u) => u.id === user?.id);
    if (!record) {
      return { success: false, error: 'User not found' };
    }
    if (record.password !== currentPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }
    record.password = newPassword;
    const safeUser = stripPassword(record);
    setUser(safeUser);
    localStorage.setItem('absu_user', JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
