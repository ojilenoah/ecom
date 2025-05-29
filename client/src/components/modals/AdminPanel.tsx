import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, X, BarChart3, Users, Store, Package, Sliders, UserPlus, ShoppingCart, Check, Ban, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminSection = 'dashboard' | 'users' | 'vendors' | 'products' | 'settings';

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');

  const { data: platformStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['/api/admin/activity'],
  });

  const navItems = [
    { id: 'dashboard' as AdminSection, label: 'Dashboard', icon: BarChart3 },
    { id: 'users' as AdminSection, label: 'Users', icon: Users },
    { id: 'vendors' as AdminSection, label: 'Vendors', icon: Store },
    { id: 'products' as AdminSection, label: 'Products', icon: Package },
    { id: 'settings' as AdminSection, label: 'Settings', icon: Sliders },
  ];

  const renderDashboard = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Platform Overview</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Users</p>
              <p className="text-2xl font-bold">{platformStats?.users || '0'}</p>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100">Active Vendors</p>
              <p className="text-2xl font-bold">{platformStats?.vendors || '0'}</p>
            </div>
            <Store className="h-8 w-8 text-emerald-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Products</p>
              <p className="text-2xl font-bold">{platformStats?.products || '0'}</p>
            </div>
            <Package className="h-8 w-8 text-purple-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total Revenue</p>
              <p className="text-2xl font-bold">${platformStats?.revenue || '0'}</p>
            </div>
            <div className="text-2xl text-orange-200">$</div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-xl">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                  {activity.type === 'user' ? (
                    <UserPlus className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  ) : activity.type === 'order' ? (
                    <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'users':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <p className="text-gray-500">User management interface would be implemented here.</p>
          </div>
        );
      case 'vendors':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Vendor Management</h2>
            <p className="text-gray-500">Vendor approval and management interface would be implemented here.</p>
          </div>
        );
      case 'products':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            <p className="text-gray-500">Global product management interface would be implemented here.</p>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Platform Settings</h2>
            <p className="text-gray-500">Platform configuration and settings would be implemented here.</p>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <div className="relative">
          
          <div className="flex h-[80vh]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-800 rounded-l-2xl p-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Admin Panel</h3>
                  <p className="text-sm text-gray-500">System Control</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeSection === item.id ? "default" : "ghost"}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full justify-start rounded-xl ${
                      activeSection === item.id 
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              {renderSection()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
