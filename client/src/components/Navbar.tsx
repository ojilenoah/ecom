import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Search, ShoppingCart, Moon, Sun, User, Store, Settings, LogOut, Package } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

interface NavbarProps {
  onCartClick: () => void;
  onAuthClick: () => void;
  onVendorDashboard: () => void;
  onAdminPanel: () => void;
  onProfileClick: () => void;
  onOrderTracking: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Navbar({ 
  onCartClick, 
  onAuthClick, 
  onVendorDashboard, 
  onAdminPanel, 
  onProfileClick,
  onOrderTracking,
  searchQuery,
  onSearchChange 
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const { data: cartCount = 0 } = useQuery<number>({
    queryKey: ['/api/cart/count'],
    enabled: !!currentUser && currentUser.role !== 'admin',
  });

  const getUserInitials = () => {
    if (!currentUser?.name) return 'U';
    return currentUser.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-sm bg-white/50 dark:bg-black/50 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">SoftShop</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </Button>
            
            {currentUser && currentUser.role !== 'admin' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCartClick}
                className="relative rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0">
                    {cartCount}
                  </Badge>
                )}
              </Button>
            )}

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-emerald-500 text-white text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">{currentUser.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuItem onClick={onProfileClick}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  
                  {currentUser.role === 'user' && (
                    <DropdownMenuItem onClick={onOrderTracking}>
                      <Package className="mr-2 h-4 w-4" />
                      Order Tracking
                    </DropdownMenuItem>
                  )}
                  
                  {currentUser.role === 'vendor' && (
                    <DropdownMenuItem onClick={onVendorDashboard}>
                      <Store className="mr-2 h-4 w-4" />
                      Vendor Dashboard
                    </DropdownMenuItem>
                  )}
                  
                  {currentUser.role === 'admin' && (
                    <DropdownMenuItem onClick={onAdminPanel}>
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={onAuthClick} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
