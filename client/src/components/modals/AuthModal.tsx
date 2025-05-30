import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();

  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      // Check for admin credentials first
      if (data.email === 'admin@gmail.com' && data.password === 'adminpassword') {
        return authService.getAdminUser();
      }
      
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
      if (!isPasswordStrong) {
        throw new Error('Password does not meet strength requirements');
      }
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
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Unable to create account. Please try again.',
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



  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({ email: '', password: '', name: '', role: 'user' });
    setPasswordStrength({
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSpecialChar: false
    });
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setFormData(prev => ({ ...prev, password: newPassword }));
                      if (mode === 'register') {
                        checkPasswordStrength(newPassword);
                      }
                    }}
                    className="mt-2 rounded-xl border-gray-300 dark:border-gray-600 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {mode === 'register' && formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password Requirements:
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                      <div className={`flex items-center gap-2 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasMinLength ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        At least 8 characters
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasUpperCase ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        One uppercase letter
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasLowerCase ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        One lowercase letter
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasNumber ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        One number
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                        {passwordStrength.hasSpecialChar ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        One special character
                      </div>
                    </div>
                  </div>
                )}
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
                disabled={
                  loginMutation.isPending || 
                  registerMutation.isPending || 
                  (mode === 'register' && !isPasswordStrong)
                }
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
