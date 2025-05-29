import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Store, Package, DollarSign, Activity, Settings, UserCheck, UserX, Edit, Trash2, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AdminSection = 'dashboard' | 'users' | 'vendors' | 'products' | 'settings';

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminStats } = useQuery<{
    users: number;
    vendors: number;
    products: number;
    revenue: string;
  }>({
    queryKey: ['/api/admin/stats'],
    enabled: isOpen,
  });

  const { data: recentActivity = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/activity'],
    enabled: isOpen,
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
    enabled: activeSection === 'users' && isOpen,
  });

  const { data: allVendors = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/vendors'],
    enabled: activeSection === 'vendors' && isOpen,
  });

  const { data: allProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/products'],
    enabled: activeSection === 'products' && isOpen,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PATCH', `/api/admin/users/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vendors'] });
      toast({
        title: 'User updated',
        description: 'User has been successfully updated.',
      });
    },
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
        description: 'User has been successfully deleted.',
      });
    },
  });

  const StatCard = ({ title, value, icon: Icon, description }: any) => (
    <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  const filteredUsers = allUsers.filter((user: any) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVendors = allVendors.filter((vendor: any) =>
    vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = allProducts.filter((product: any) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Admin Panel</DialogTitle>
        <DialogDescription className="sr-only">Administrative dashboard for managing users, vendors, and products</DialogDescription>
        
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Settings className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Admin Panel</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage your e-commerce platform</p>
            </div>
          </div>

          <Tabs value={activeSection} onValueChange={(value) => setActiveSection(value as AdminSection)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto scrollbar-hidden">
              <TabsContent value="dashboard" className="space-y-6 mt-0">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Total Users"
                    value={adminStats?.users || 0}
                    icon={Users}
                    description="Active platform users"
                  />
                  <StatCard
                    title="Vendors"
                    value={adminStats?.vendors || 0}
                    icon={Store}
                    description="Registered vendors"
                  />
                  <StatCard
                    title="Products"
                    value={adminStats?.products || 0}
                    icon={Package}
                    description="Total products listed"
                  />
                  <StatCard
                    title="Revenue"
                    value={`$${adminStats?.revenue || '0.00'}`}
                    icon={DollarSign}
                    description="Total platform revenue"
                  />
                </div>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Recent Activity</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-60 overflow-y-auto scrollbar-hidden">
                      {recentActivity.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      ) : (
                        recentActivity.map((activity: any, index: number) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">{activity.message}</p>
                              <p className="text-xs text-gray-500">{activity.timestamp}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-6 mt-0">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage platform users and their permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
                      {filteredUsers.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">
                              {user.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Badge variant={user.role === 'vendor' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserMutation.mutate({ 
                                id: user.id, 
                                role: user.role === 'customer' ? 'vendor' : 'customer' 
                              })}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="vendors" className="space-y-6 mt-0">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle>Vendor Management</CardTitle>
                    <CardDescription>Manage vendor accounts and approvals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
                      {filteredVendors.map((vendor: any) => (
                        <div key={vendor.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                              {vendor.name?.charAt(0) || 'V'}
                            </div>
                            <div>
                              <p className="font-medium">{vendor.name}</p>
                              <p className="text-sm text-gray-500">{vendor.email}</p>
                              <p className="text-xs text-gray-400">Products: {vendor.product_count || 0}</p>
                            </div>
                            <Badge variant="default">Vendor</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateUserMutation.mutate({ id: vendor.id, role: 'customer' })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products" className="space-y-6 mt-0">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Oversee all products on the platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hidden">
                      {filteredProducts.map((product: any) => (
                        <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.category}</p>
                              <p className="text-sm text-emerald-600 font-medium">${product.price}</p>
                            </div>
                            <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                              Stock: {product.stock}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">By: {product.vendor_name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0">
                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20">
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                    <CardDescription>Configure platform-wide settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Platform Commission (%)</Label>
                        <Input type="number" placeholder="5" />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Order Amount</Label>
                        <Input type="number" placeholder="10.00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Default Currency</Label>
                        <Select defaultValue="USD">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Auto-approve Vendors</Label>
                        <Select defaultValue="false">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                      Save Settings
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}