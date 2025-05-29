import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

interface CartItemWithProduct {
  user_id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: string;
    image_url: string;
  };
}

export function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: !!currentUser && currentUser.role !== 'admin',
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ product_id, quantity }: { product_id: string; quantity: number }) => {
      return apiRequest('PATCH', `/api/cart/${product_id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (product_id: string) => {
      return apiRequest('DELETE', `/api/cart/${product_id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart.',
      });
    },
  });

  const updateQuantity = (product_id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItemMutation.mutate(product_id);
    } else {
      updateQuantityMutation.mutate({ product_id, quantity: newQuantity });
    }
  };

  const total = cartItems.reduce((sum: number, item: CartItemWithProduct) => 
    sum + (parseFloat(item.product.price) * item.quantity), 0
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Add some items to your cart before checking out.',
        variant: 'destructive',
      });
      return;
    }
    onClose();
    onCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Shopping Cart</DialogTitle>
        <DialogDescription className="sr-only">View and manage items in your shopping cart</DialogDescription>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/20 hover:bg-black/30 text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-emerald-500" />
              <span>Shopping Cart</span>
            </h2>
            
            {isLoading ? (
              <div className="text-center py-8">Loading cart...</div>
            ) : cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                  {cartItems.map((item: CartItemWithProduct) => (
                    <div key={item.product_id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img 
                          src={item.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&h=64'} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">${item.product.price}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="w-6 h-6"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          className="w-6 h-6"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.product_id)}
                          className="w-6 h-6 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cart Summary */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Shipping:</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-emerald-500">${total.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl"
              >
                Proceed to Checkout
              </Button>
              <Button 
                variant="outline"
                onClick={onClose}
                className="w-full border-gray-300 dark:border-gray-600 hover:border-emerald-500 font-semibold py-3 rounded-xl"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
