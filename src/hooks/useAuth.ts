import { useEffect, useState } from 'react';
import { authService, AuthState } from '../services/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    changePassword: authService.changePassword.bind(authService),
    deleteAccount: authService.deleteAccount.bind(authService),
    clearError: authService.clearError.bind(authService),
  };
}
