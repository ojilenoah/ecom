import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, X, Plus, Edit, Trash2, DollarSign, ShoppingCart, Package, Star, User, Truck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { VendorProfileModal } from './VendorProfileModal';
import { OrderTrackingModal } from './OrderTrackingModal';

interface VendorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendorDashboard({ isOpen, onClose }: VendorDashboardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showOrderTracking, setShowOrderTracking] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: ''
  });

  const categories = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports & Outdoors',
    'Books',
    'Health & Beauty',
    'Toys & Games',
    'Automotive',
    'Food & Beverages',
    'Office Supplies'
  ];

  const { data: vendorStats } = useQuery<{
    revenue: string;
    orders: number;
    products: number;
    rating: string;
  }>({
    queryKey: ['/api/vendor/stats'],
    enabled: !!currentUser && currentUser.role === 'vendor',
  });

  const { data: vendorProducts = [] } = useQuery<any[]>({
    queryKey: ['/api/vendor/products'],
    enabled: !!currentUser && currentUser.role === 'vendor',
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return apiRequest('POST', '/api/vendor/products', productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/stats'] });
      setShowAddProduct(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image_url: ''
      });
      toast({
        title: 'Product created',
        description: 'Your product has been successfully created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return apiRequest('PATCH', `/api/vendor/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/stats'] });
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image_url: ''
      });
      toast({
        title: 'Product updated',
        description: 'Your product has been successfully updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest('DELETE', `/api/vendor/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/stats'] });
      toast({
        title: 'Product deleted',
        description: 'Your product has been successfully deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleAddProduct = () => {
    setShowAddProduct(true);
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image_url: ''
    });
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowAddProduct(true);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '',
      category: product.category || '',
      stock: product.stock ? product.stock.toString() : '',
      image_url: product.image_url || ''
    });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleSubmitProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const productData = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      stock: parseInt(productForm.stock) || 0,
      image_url: productForm.image_url || null
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto scrollbar-hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Vendor Dashboard</DialogTitle>
        <DialogDescription className="sr-only">Manage your products and view vendor statistics</DialogDescription>
        <div className="relative">
          
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Vendor Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your products and sales</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setShowOrderTracking(true)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Truck className="h-4 w-4" />
                  <span>Track Orders</span>
                </Button>
                <Button
                  onClick={() => setShowProfileEdit(true)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <User className="h-4 w-4" />
                  <span>Edit Profile</span>
                </Button>
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
                              onClick={() => handleEditProduct(product)}
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

      {/* Product Creation/Edit Modal - Overlay */}
      {showAddProduct && (
        <Dialog open={showAddProduct} onOpenChange={() => setShowAddProduct(false)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20 z-[60]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddProduct(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productPrice">Price *</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productDescription">Description</Label>
                  <Textarea
                    id="productDescription"
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productCategory">Category *</Label>
                    <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="productStock">Stock</Label>
                    <Input
                      id="productStock"
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="productImage">Image URL</Label>
                  <Input
                    id="productImage"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleSubmitProduct}
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {createProductMutation.isPending || updateProductMutation.isPending 
                      ? 'Saving...' 
                      : editingProduct ? 'Update Product' : 'Create Product'
                    }
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddProduct(false);
                      setEditingProduct(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
