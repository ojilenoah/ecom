import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, X, Lock } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export function CheckoutModal({ isOpen, onClose, total }: CheckoutModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/orders/checkout', {
        paymentMethod: 'dummy'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
      toast({
        title: 'Order placed successfully!',
        description: 'Your order has been placed and will be fulfilled in 30 seconds.',
      });
      onClose();
      
      // Simulate order fulfillment after 30 seconds
      setTimeout(() => {
        toast({
          title: 'Order fulfilled!',
          description: 'Your order has been processed and is ready for rating.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders/user'] });
      }, 30000);
    },
    onError: () => {
      toast({
        title: 'Checkout failed',
        description: 'Unable to process your order. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing delay
    setTimeout(() => {
      checkoutMutation.mutate();
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-white/20 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400/20">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="p-4 sm:p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold">Secure Checkout</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                Total: <span className="font-bold text-emerald-500">${total.toFixed(2)}</span>
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Payment Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center text-sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Payment Information (Demo)
                </h3>
                
                <div>
                  <Label htmlFor="cardNumber" className="text-sm">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                    className="mt-1 rounded-lg h-9"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="expiryDate" className="text-sm">Expiry</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentData.expiryDate}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="mt-1 rounded-lg h-9"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-sm">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                      className="mt-1 rounded-lg h-9"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="nameOnCard" className="text-sm">Name</Label>
                    <Input
                      id="nameOnCard"
                      placeholder="John Doe"
                      value={paymentData.nameOnCard}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, nameOnCard: e.target.value }))}
                      className="mt-1 rounded-lg h-9"
                      required
                    />
                  </div>
                </div>
              </div>


              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  type="submit" 
                  disabled={isProcessing || checkoutMutation.isPending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl"
                >
                  {isProcessing || checkoutMutation.isPending ? (
                    'Processing...'
                  ) : (
                    `Complete Order - $${total.toFixed(2)}`
                  )}
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-3">
                  <Lock className="inline mr-1 h-3 w-3" />
                  This is a demo checkout. No real payment will be processed.
                </p>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
