/**
 * 利用者識別（userId）の軽量 Auth Context
 * /u/* の Auth Gate と confirm での userId 取得に使用
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getUserId,
  getDisplayName,
  setUserId as persistUserId,
  setDisplayName as persistDisplayName,
  clearUser as persistClearUser,
} from '../lib/userStorage';

export interface AuthState {
  userId: string | null;
  displayName: string | null;
  isReady: boolean;
}

export interface AuthContextValue extends AuthState {
  setUserId: (userId: string) => void;
  setDisplayName: (displayName: string) => void;
  clearUser: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    displayName: null,
    isReady: false,
  });

  const refresh = useCallback(() => {
    setState({
      userId: getUserId(),
      displayName: getDisplayName(),
      isReady: true,
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setUserId = useCallback((userId: string) => {
    persistUserId(userId);
    setState((prev) => ({ ...prev, userId: userId.trim(), isReady: true }));
  }, []);

  const setDisplayName = useCallback((displayName: string) => {
    persistDisplayName(displayName);
    setState((prev) => ({ ...prev, displayName: displayName.trim() }));
  }, []);

  const clearUser = useCallback(() => {
    persistClearUser();
    setState({ userId: null, displayName: null, isReady: true });
  }, []);

  const value: AuthContextValue = {
    ...state,
    setUserId,
    setDisplayName,
    clearUser,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
