import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Package, Star, Edit } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar_url: ''
  });
  const { currentUser, setCurrentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    enabled: !!currentUser && currentUser.role !== 'admin',
  });

  const { data: userOrders = [] } = useQuery({
    queryKey: ['/api/user/orders'],
    enabled: !!currentUser && currentUser.role !== 'admin',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('PATCH', '/api/user/profile', data);
    },
    onSuccess: (response) => {
      const updatedUser = response.json();
      setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Unable to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setFormData({
        name: userProfile?.name || '',
        email: userProfile?.email || '',
        avatar_url: userProfile?.avatar_url || ''
      });
      setIsEditing(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const getUserInitials = () => {
    if (!userProfile?.name) return 'U';
    return userProfile.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (currentUser?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Admin Account</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Admin accounts don't have traditional user profiles.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditToggle}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarFallback className="bg-emerald-500 text-white text-xl">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{userProfile?.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{userProfile?.email}</p>
                  <Badge className="mt-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100">
                    {userProfile?.role === 'vendor' ? 'Vendor' : 'Customer'}
                  </Badge>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleEditToggle}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 flex items-center">
                        <Package className="mr-2 h-4 w-4" />
                        Order Summary
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total Orders</span>
                          <p className="font-semibold">{userOrders.length}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
                          <p className="font-semibold">
                            ${userOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Orders History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                    <p className="text-gray-400 text-sm mt-2">
                      Start shopping to see your orders here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order: any) => (
                      <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <p className="font-semibold mt-1">${order.total}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {order.items?.map((item: any, index: number) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded">
                                {/* Product thumbnail would go here */}
                              </div>
                              <div className="flex-1">
                                <span>{item.name}</span>
                                <span className="text-gray-500 ml-2">×{item.quantity}</span>
                              </div>
                              <span className="font-medium">${item.price}</span>
                            </div>
                          ))}
                        </div>
                        
                        {order.status === 'fulfilled' && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                            >
                              <Star className="mr-1 h-3 w-3" />
                              Rate Products
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
