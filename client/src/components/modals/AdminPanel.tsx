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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: platformStats } = useQuery<{
    users: number;
    vendors: number;
    products: number;
    revenue: string;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: recentActivity = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/activity'],
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    enabled: activeSection === 'users',
  });

  const { data: allVendors = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/vendors'],
    enabled: activeSection === 'vendors',
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/products'],
    enabled: activeSection === 'products',
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('DELETE', `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'User deleted',
        description: 'User has been successfully removed.',
      });
    },
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
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">All Users ({allUsers.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">User</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Joined</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((user: any) => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                {user.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{user.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{user.email}</td>
                        <td className="py-4 px-4">
                          <Badge variant={user.role === 'vendor' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUserMutation.mutate(user.id)}
                            disabled={deleteUserMutation.isPending}
                            className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {allUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'vendors':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Vendor Management</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">All Vendors ({allVendors.length})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Vendor</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Business</th>
                      <th className="text-left py-3 px-4 font-semibold">Products</th>
                      <th className="text-left py-3 px-4 font-semibold">Status</th>
                      <th className="text-left py-3 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVendors.map((vendor: any) => (
                      <tr key={vendor.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                              <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">{vendor.name || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">ID: {vendor.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{vendor.email}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{vendor.business_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{vendor.business_type || 'General'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline">
                            {vendor.product_count || 0} products
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Active
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(vendor.id)}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {allVendors.length === 0 && (
                  <div className="text-center py-8">
                    <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No vendors found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'products':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Product Management</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">All Products ({allProducts.length})</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProducts.map((product: any) => (
                  <div key={product.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 border">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold truncate">{product.name}</h4>
                        <p className="text-sm text-gray-500">{product.category}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Price:</span>
                        <span className="font-semibold text-emerald-600">${product.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Stock:</span>
                        <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                          {product.stock} units
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Vendor:</span>
                        <span className="text-sm">{product.vendor_name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {allProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No products found</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Platform Settings</h2>
            
            <div className="space-y-6">
              {/* General Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="maintenance">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Enable maintenance mode for platform updates</p>
                    </div>
                    <input type="checkbox" className="toggle" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">Allow User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vendor-approval">Require Vendor Approval</Label>
                      <p className="text-sm text-gray-500">Manually approve new vendor applications</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                </div>
              </div>
              
              {/* Payment Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission">Platform Commission (%)</Label>
                    <Input id="commission" type="number" placeholder="5" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="min-order">Minimum Order Amount</Label>
                    <Input id="min-order" type="number" placeholder="10.00" className="mt-1" />
                  </div>
                </div>
              </div>
              
              {/* Email Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" placeholder="smtp.gmail.com" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input id="smtp-port" placeholder="587" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="from-email">From Email</Label>
                      <Input id="from-email" placeholder="noreply@softshop.com" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Save Settings
                </Button>
              </div>
            </div>
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
