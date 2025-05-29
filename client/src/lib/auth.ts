import { User } from '@shared/schema';

export interface AuthUser extends Omit<User, 'password_hash'> {}

export interface AdminUser {
  id: 'admin';
  email: 'admin@gmail.com';
  role: 'admin';
  name: 'Admin User';
}

export type CurrentUser = AuthUser | AdminUser | null;

const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: 'admin'
};

export const authService = {
  getCurrentUser(): CurrentUser {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem('currentUser');
      }
    }
    return null;
  },

  setCurrentUser(user: CurrentUser) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },

  logout() {
    localStorage.removeItem('currentUser');
  },

  isAdmin(user: CurrentUser): user is AdminUser {
    return user?.role === 'admin';
  },

  isVendor(user: CurrentUser): boolean {
    return user?.role === 'vendor';
  },

  isUser(user: CurrentUser): boolean {
    return user?.role === 'user';
  },

  validateAdminCredentials(email: string, password: string): boolean {
    return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
  },

  getAdminUser(): AdminUser {
    return {
      id: 'admin',
      email: 'admin@gmail.com',
      role: 'admin',
      name: 'Admin User'
    };
  }
};
