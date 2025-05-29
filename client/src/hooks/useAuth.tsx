import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, CurrentUser } from '@/lib/auth';

interface AuthContextType {
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const user = authService.getCurrentUser();
    setCurrentUserState(user);
    setIsLoading(false);
  }, []);

  const setCurrentUser = (user: CurrentUser) => {
    setCurrentUserState(user);
    authService.setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUserState(null);
    authService.logout();
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        setCurrentUser, 
        logout, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
