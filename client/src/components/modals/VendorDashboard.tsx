import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Store, X, Plus, Edit, Trash2, DollarSign, ShoppingCart, Package, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface VendorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorDashboard({ isOpen, onClose }: VendorDashboardProps) {
  const { currentUser } = useAuth();

  const { data: vendorStats } = useQuery({
    queryKey: ['/api/vendor/stats'],
    enabled: !!currentUser && currentUser.role === 'vendor',
  });

  const { data: vendorProducts = [] } = useQuery({
    queryKey: ['/api/vendor/products'],
    enabled: !!currentUser && currentUser.role === 'vendor',
  });

  const handleAddProduct = () => {
    // TODO: Implement add product modal
    console.log('Add product modal');
  };

  const handleEditProduct = (productId: string) => {
    // TODO: Implement edit product modal
    console.log('Edit product:', productId);
  };

  const handleDeleteProduct = (productId: string) => {
    // TODO: Implement delete product
    console.log('Delete product:', productId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
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
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Vendor Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400">Manage your products and sales</p>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Total Revenue</p>
                    <p className="text-2xl font-bold">${vendorStats?.revenue || '0'}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-200" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Orders</p>
                    <p className="text-2xl font-bold">{vendorStats?.orders || '0'}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Products</p>
                    <p className="text-2xl font-bold">{vendorProducts.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Rating</p>
                    <p className="text-2xl font-bold">{vendorStats?.rating || '4.8'} ★</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>
            
            {/* Products Section */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Your Products</h3>
              <Button 
                onClick={handleAddProduct}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </Button>
            </div>
            
            {/* Products Table */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden">
              {vendorProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No products yet</p>
                  <Button onClick={handleAddProduct} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold">Product</th>
                      <th className="text-left p-4 font-semibold">Price</th>
                      <th className="text-left p-4 font-semibold">Stock</th>
                      <th className="text-left p-4 font-semibold">Status</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {vendorProducts.map((product: any) => (
                      <tr key={product.id}>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <img 
                                src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold">${product.price}</td>
                        <td className="p-4">{product.stock}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(product.id)}
                              className="p-2 text-gray-500 hover:text-emerald-500"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-2 text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
