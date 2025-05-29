import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle, Clock, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackingModal({ isOpen, onClose }: OrderTrackingModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);

  const { data: userOrders = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/orders/user'],
    enabled: !!currentUser && currentUser.role !== 'admin' && isOpen,
  });

  const ratingMutation = useMutation({
    mutationFn: async (data: { orderId: string; rating: number; comment?: string }) => {
      return apiRequest('POST', '/api/orders/rate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback!',
      });
      setSelectedOrder(null);
      setRating(0);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'paid':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'fulfilled':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'paid':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'fulfilled':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const handleRateOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const submitRating = () => {
    if (!selectedOrder || rating === 0) {
      toast({
        title: 'Please select a rating',
        description: 'You must select at least 1 star to submit your rating.',
        variant: 'destructive',
      });
      return;
    }

    ratingMutation.mutate({
      orderId: selectedOrder.id,
      rating,
      comment: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hidden bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <DialogTitle className="sr-only">Order Tracking</DialogTitle>
        <DialogDescription className="sr-only">Track your orders and view order history</DialogDescription>
        
        <div className="p-8">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Order Tracking</h2>
              <p className="text-gray-600 dark:text-gray-400">Track your orders and leave reviews</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Loading your orders...</p>
            </div>
          ) : userOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
              <p className="text-sm text-gray-400 mt-2">Your order history will appear here once you make a purchase</p>
            </div>
          ) : (
            <div className="space-y-6">
              {userOrders.map((order: any) => (
                <div key={order.id} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-gray-500">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusColor(order.status)} font-medium`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                      <span className="text-lg font-bold text-emerald-500">${order.total}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items && Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-700 rounded-xl">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product?.name || 'Product'}</h4>
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">${(parseFloat(item.product?.price || '0') * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Status Timeline */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`flex items-center space-x-2 ${order.status === 'pending' || order.status === 'paid' || order.status === 'fulfilled' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Order Placed</span>
                    </div>
                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                    <div className={`flex items-center space-x-2 ${order.status === 'paid' || order.status === 'fulfilled' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <Package className="h-4 w-4" />
                      <span className="text-sm">Processing</span>
                    </div>
                    <div className="h-px bg-gray-300 dark:bg-gray-600 flex-1"></div>
                    <div className={`flex items-center space-x-2 ${order.status === 'fulfilled' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      <Truck className="h-4 w-4" />
                      <span className="text-sm">Delivered</span>
                    </div>
                  </div>

                  {/* Rate Order Button */}
                  {order.status === 'fulfilled' && (
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleRateOrder(order)}
                        variant="outline"
                        className="text-emerald-500 border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Rate Order
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rating Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Rate Your Order</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  How was your experience with order #{selectedOrder.id.slice(0, 8)}?
                </p>
              </div>

              <div className="flex justify-center space-x-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={submitRating}
                  disabled={rating === 0 || ratingMutation.isPending}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                  {ratingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null);
                    setRating(0);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}