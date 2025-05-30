import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, X, BarChart3, Users, Store, Package, Sliders, UserPlus, ShoppingCart, Check, Ban, Edit, Trash2, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { OrderTrackingModal } from './OrderTrackingModal';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminSection = 'dashboard' | 'users' | 'vendors' | 'products' | 'settings';

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [showOrderTracking, setShowOrderTracking] = useState(false);
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
    staleTime: 0,
    gcTime: 0
  });

  // Debug vendor data
  console.log('Vendor data received:', allVendors.map(v => ({ id: v.id, name: v.name, is_approved: v.is_approved })));

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/products'],
    enabled: activeSection === 'products',
  });

  const { data: settings = {} } = useQuery<any>({
    queryKey: ['/api/admin/settings'],
    enabled: activeSection === 'settings',
  });

  const [settingsForm, setSettingsForm] = useState({
    maintenance_mode: false,
    allow_user_registration: true,
    require_vendor_approval: true,
    platform_commission: '5',
    minimum_order_amount: '10.00',
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    from_email: 'noreply@softshop.com',
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setSettingsForm({
        maintenance_mode: settings.maintenance_mode === 'true',
        allow_user_registration: settings.allow_user_registration === 'true',
        require_vendor_approval: settings.require_vendor_approval === 'true',
        platform_commission: settings.platform_commission || '5',
        minimum_order_amount: settings.minimum_order_amount || '10.00',
        smtp_host: settings.smtp_host || 'smtp.gmail.com',
        smtp_port: settings.smtp_port || '587',
        from_email: settings.from_email || 'noreply@softshop.com',
      });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return apiRequest('PUT', '/api/admin/settings', updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: 'Settings saved',
        description: 'Platform settings have been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Save failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSettingsChange = (key: string, value: any) => {
    setSettingsForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Convert form data to API format
    const settingsToSave = {
      maintenance_mode: settingsForm.maintenance_mode.toString(),
      allow_user_registration: settingsForm.allow_user_registration.toString(),
      require_vendor_approval: settingsForm.require_vendor_approval.toString(),
      platform_commission: settingsForm.platform_commission,
      minimum_order_amount: settingsForm.minimum_order_amount,
      smtp_host: settingsForm.smtp_host,
      smtp_port: settingsForm.smtp_port,
      from_email: settingsForm.from_email,
    };
    
    updateSettingsMutation.mutate(settingsToSave);
  };

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

  const updateVendorApprovalMutation = useMutation({
    mutationFn: async ({ vendorId, isApproved }: { vendorId: string; isApproved: boolean }) => {
      return apiRequest('PATCH', `/api/admin/vendors/${vendorId}/approval`, { is_approved: isApproved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: 'Vendor status updated',
        description: 'Vendor approval status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update vendor approval status.',
        variant: 'destructive',
      });
    }
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
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold">Vendor Management</h2>
              <div className="flex flex-col sm:flex-row gap-2 text-sm">
                <Badge variant="outline" className="w-fit">
                  {allVendors.filter((v: any) => v.is_approved).length} Approved
                </Badge>
                <Badge variant="outline" className="w-fit text-orange-600 border-orange-600">
                  {allVendors.filter((v: any) => !v.is_approved).length} Pending
                </Badge>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-lg font-semibold">All Vendors ({allVendors.length})</h3>
              </div>
              
              {/* Mobile-friendly cards for small screens */}
              <div className="block sm:hidden space-y-4">
                {allVendors.map((vendor: any) => (
                  <div key={vendor.id} className="bg-white dark:bg-gray-700 rounded-xl p-4 border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{vendor.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{vendor.email}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={vendor.is_approved 
                          ? "text-green-600 border-green-600" 
                          : "text-orange-600 border-orange-600"
                        }
                      >
                        {vendor.is_approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="text-sm text-gray-500">Business: </span>
                        <span className="text-sm">{vendor.business_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Products: </span>
                        <span className="text-sm">{vendor.product_count || 0}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {!vendor.is_approved ? (
                        <Button
                          size="sm"
                          onClick={() => updateVendorApprovalMutation.mutate({ 
                            vendorId: vendor.id, 
                            isApproved: true 
                          })}
                          disabled={updateVendorApprovalMutation.isPending}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => updateVendorApprovalMutation.mutate({ 
                            vendorId: vendor.id, 
                            isApproved: false 
                          })}
                          disabled={updateVendorApprovalMutation.isPending}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Disapprove
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(vendor.id)}
                        disabled={deleteUserMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900 text-xs px-3 py-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Table for larger screens */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Vendor</th>
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Email</th>
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Business</th>
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Products</th>
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Status</th>
                      <th className="text-left py-3 px-2 lg:px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVendors.map((vendor: any) => (
                      <tr key={vendor.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-2 lg:px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                              <Store className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-sm lg:text-base">{vendor.name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">ID: {vendor.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 lg:px-4 text-sm">{vendor.email}</td>
                        <td className="py-3 px-2 lg:px-4">
                          <div>
                            <p className="font-medium text-sm">{vendor.business_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{vendor.business_type || 'General'}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 lg:px-4">
                          <Badge variant="outline" className="text-xs">
                            {vendor.product_count || 0} products
                          </Badge>
                        </td>
                        <td className="py-3 px-2 lg:px-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${vendor.is_approved 
                              ? "text-green-600 border-green-600" 
                              : "text-orange-600 border-orange-600"
                            }`}
                          >
                            {vendor.is_approved ? 'Approved' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 lg:px-4">
                          <div className="flex space-x-1 lg:space-x-2">
                            {!vendor.is_approved ? (
                              <Button
                                size="sm"
                                onClick={() => updateVendorApprovalMutation.mutate({ 
                                  vendorId: vendor.id, 
                                  isApproved: true 
                                })}
                                disabled={updateVendorApprovalMutation.isPending}
                                className="bg-green-500 hover:bg-green-600 text-white h-8 px-2 lg:px-3"
                                title="Approve vendor"
                              >
                                <Check className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => updateVendorApprovalMutation.mutate({ 
                                  vendorId: vendor.id, 
                                  isApproved: false 
                                })}
                                disabled={updateVendorApprovalMutation.isPending}
                                className="bg-red-500 hover:bg-red-600 text-white h-8 px-2 lg:px-3"
                                title="Disapprove vendor"
                              >
                                <X className="h-3 w-3 lg:h-4 lg:w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(vendor.id)}
                              disabled={deleteUserMutation.isPending}
                              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900 h-8 px-2 lg:px-3"
                              title="Delete vendor"
                            >
                              <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {allVendors.length === 0 && (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No vendors found</p>
                </div>
              )}
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
                    <input 
                      type="checkbox" 
                      id="maintenance"
                      checked={settingsForm.maintenance_mode}
                      onChange={(e) => handleSettingsChange('maintenance_mode', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="registration">Allow User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new users to register accounts</p>
                    </div>
                    <input 
                      type="checkbox" 
                      id="registration"
                      checked={settingsForm.allow_user_registration}
                      onChange={(e) => handleSettingsChange('allow_user_registration', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="vendor-approval">Require Vendor Approval</Label>
                      <p className="text-sm text-gray-500">Manually approve new vendor applications</p>
                    </div>
                    <input 
                      type="checkbox" 
                      id="vendor-approval"
                      checked={settingsForm.require_vendor_approval}
                      onChange={(e) => handleSettingsChange('require_vendor_approval', e.target.checked)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Payment Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission">Platform Commission (%)</Label>
                    <Input 
                      id="commission" 
                      type="number" 
                      value={settingsForm.platform_commission}
                      onChange={(e) => handleSettingsChange('platform_commission', e.target.value)}
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-order">Minimum Order Amount</Label>
                    <Input 
                      id="min-order" 
                      type="number" 
                      value={settingsForm.minimum_order_amount}
                      onChange={(e) => handleSettingsChange('minimum_order_amount', e.target.value)}
                      className="mt-1" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Email Settings */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Email Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input 
                      id="smtp-host" 
                      value={settingsForm.smtp_host}
                      onChange={(e) => handleSettingsChange('smtp_host', e.target.value)}
                      className="mt-1" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input 
                        id="smtp-port" 
                        value={settingsForm.smtp_port}
                        onChange={(e) => handleSettingsChange('smtp_port', e.target.value)}
                        className="mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="from-email">From Email</Label>
                      <Input 
                        id="from-email" 
                        value={settingsForm.from_email}
                        onChange={(e) => handleSettingsChange('from_email', e.target.value)}
                        className="mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={saveSettings}
                  disabled={updateSettingsMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
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
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Admin Panel</DialogTitle>
        <DialogDescription className="sr-only">System administration and control panel</DialogDescription>
        <div className="relative">
          
          <div className="flex flex-col lg:flex-row h-[80vh]">
            {/* Sidebar */}
            <div className="w-full lg:w-64 bg-gray-50 dark:bg-gray-800 rounded-t-2xl lg:rounded-l-2xl lg:rounded-t-none p-4 lg:p-6">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold">Admin Panel</h3>
                  <p className="text-sm text-gray-500">System Control</p>
                </div>
              </div>
              
              <nav className="space-y-2 lg:space-y-2">
                <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible space-x-2 lg:space-x-0 lg:space-y-2 pb-2 lg:pb-0">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex-shrink-0 lg:w-full justify-start rounded-xl text-sm lg:text-base ${
                        activeSection === item.id 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="mr-2 lg:mr-3 h-4 w-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </nav>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
              {renderSection()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
