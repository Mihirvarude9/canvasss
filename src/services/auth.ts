import { apiClient, ApiError } from './api';
import { User, LoginRequest, RegisterRequest } from './types';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    const token = apiClient.getToken();
    if (token) {
      try {
        const response = await apiClient.getCurrentUser();
        if (response.success && response.data) {
          this.setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          this.logout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        this.logout();
      }
    } else {
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): AuthState {
    return this.state;
  }

  async login(credentials: LoginRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await apiClient.login(credentials);
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        this.setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Login failed';
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const response = await apiClient.register(userData);
      if (response.success && response.data) {
        apiClient.setToken(response.data.token);
        this.setState({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Registration failed';
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  logout(): void {
    apiClient.setToken(null);
    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }

  async updateProfile(data: Partial<User>): Promise<void> {
    if (!this.state.user) {
      throw new Error('Not authenticated');
    }

    this.setState({ isLoading: true, error: null });

    try {
      const response = await apiClient.updateUserProfile(data);
      if (response.success && response.data) {
        this.setState({
          user: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Profile update failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Profile update failed';
      this.setState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.state.user) {
      throw new Error('Not authenticated');
    }

    this.setState({ isLoading: true, error: null });

    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      if (response.success) {
        this.setState({
          isLoading: false,
          error: null,
        });
      } else {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Password change failed';
      this.setState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  async deleteAccount(): Promise<void> {
    if (!this.state.user) {
      throw new Error('Not authenticated');
    }

    this.setState({ isLoading: true, error: null });

    try {
      const response = await apiClient.deleteAccount();
      if (response.success) {
        this.logout();
      } else {
        throw new Error(response.error || 'Account deletion failed');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Account deletion failed';
      this.setState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }

  clearError(): void {
    this.setState({ error: null });
  }
}

export const authService = new AuthService();
