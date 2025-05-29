import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { data: productRating } = useQuery<{ average_rating: number; review_count: number }>({
    queryKey: ['/api/products', product.id, 'rating'],
  });

  const averageRating = productRating?.average_rating || 0;
  const reviewCount = productRating?.review_count || 0;

  return (
    <Card 
      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden rounded-t-2xl">
        <img 
          src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
          <span className="text-xl font-bold text-emerald-500">${product.price}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-3 w-3 ${i < Math.floor(averageRating) ? 'fill-current' : ''}`} 
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 ml-1">({reviewCount})</span>
          </div>
          {product.category && (
            <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800">
              {product.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
