import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, X, Settings } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user' as 'user' | 'vendor'
  });
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', data);
      return await response.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully signed in.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Login failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; role: 'user' | 'vendor' }) => {
      const response = await apiRequest('POST', '/api/auth/register', { ...data, password_hash: data.password });
      return await response.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      toast({
        title: 'Account created!',
        description: 'Your account has been successfully created.',
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Registration failed',
        description: 'Unable to create account. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'login') {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const handleAdminLogin = () => {
    if (authService.validateAdminCredentials('admin@gmail.com', 'admin')) {
      const adminUser = authService.getAdminUser();
      setCurrentUser(adminUser);
      toast({
        title: 'Admin access granted',
        description: 'Welcome to the admin panel.',
      });
      onClose();
    } else {
      toast({
        title: 'Access denied',
        description: 'Invalid admin credentials.',
        variant: 'destructive',
      });
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ email: '', password: '', name: '', role: 'user' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'login' ? 'Sign in to your SoftShop account' : 'Create a new SoftShop account'}
        </DialogDescription>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {mode === 'login' ? 'Welcome back to SoftShop' : 'Join SoftShop today'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-2 rounded-xl border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-2 rounded-xl border-gray-300 dark:border-gray-600"
                  required
                />
              </div>
              
              {mode === 'register' && (
                <>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-2 rounded-xl border-gray-300 dark:border-gray-600"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Account Type</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: 'user' | 'vendor') => 
                        setFormData(prev => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger className="mt-2 rounded-xl border-gray-300 dark:border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Customer</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                disabled={loginMutation.isPending || registerMutation.isPending}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl"
              >
                {loginMutation.isPending || registerMutation.isPending 
                  ? 'Please wait...' 
                  : mode === 'login' ? 'Sign In' : 'Create Account'
                }
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                <Button 
                  variant="link" 
                  onClick={toggleMode}
                  className="text-emerald-500 hover:text-emerald-600 ml-1 p-0 h-auto font-medium"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Button>
              </p>
              
              {/* Admin Login Section */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="link"
                  onClick={handleAdminLogin}
                  className="text-xs text-gray-500 hover:text-emerald-500 p-0 h-auto"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  Admin Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
