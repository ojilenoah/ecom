import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/modals/ProductModal';
import { CartModal } from '@/components/modals/CartModal';
import { AuthModal } from '@/components/modals/AuthModal';
import { VendorDashboard } from '@/components/modals/VendorDashboard';
import { AdminPanel } from '@/components/modals/AdminPanel';
import { CheckoutModal } from '@/components/modals/CheckoutModal';
import { OrderTrackingModal } from '@/components/modals/OrderTrackingModal';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@shared/schema';

export default function Home() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isVendorDashboardOpen, setIsVendorDashboardOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { currentUser } = useAuth();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', selectedCategory, searchQuery],
  });

  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['/api/categories'],
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && product.is_active;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleCheckout = (total: number) => {
    setCartTotal(total);
    setIsCheckoutOpen(true);
  };

  const handleProfileClick = () => {
    // TODO: Navigate to profile page
    console.log('Navigate to profile');
  };

  const allCategories = ['All', ...categories];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar
        onCartClick={() => setIsCartOpen(true)}
        onAuthClick={() => setIsAuthOpen(true)}
        onVendorDashboard={() => setIsVendorDashboardOpen(true)}
        onAdminPanel={() => setIsAdminPanelOpen(true)}
        onProfileClick={handleProfileClick}
        onOrderTracking={() => setIsOrderTrackingOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Mobile Search Bar */}
        <div className="sm:hidden mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {allCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-xl ${
                  selectedCategory === category
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found</p>
            {searchQuery && (
              <p className="text-gray-400 mt-2">
                Try adjusting your search terms or browse different categories
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {currentUser?.role === 'vendor' && (
        <VendorDashboard
          isOpen={isVendorDashboardOpen}
          onClose={() => setIsVendorDashboardOpen(false)}
        />
      )}

      {currentUser?.role === 'admin' && (
        <AdminPanel
          isOpen={isAdminPanelOpen}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={cartTotal}
      />

      {currentUser && (
        <OrderTrackingModal
          isOpen={isOrderTrackingOpen}
          onClose={() => setIsOrderTrackingOpen(false)}
        />
      )}
    </div>
  );
}
