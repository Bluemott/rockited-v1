import { WooProduct } from '@/lib/types';
import ProductCard from './ProductCard';
import { ProductGridSkeleton } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/error';
import { StaggerContainer, StaggerItem } from '@/components/ui/motion';

interface ProductGridProps {
  products: WooProduct[];
  loading?: boolean;
}

export default function ProductGrid({ products, loading = false }: ProductGridProps) {
  if (loading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="We couldn't find any products matching your criteria. Try adjusting your filters or search terms."
      />
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch [grid-auto-rows:1fr]">
      {products.map((product) => (
        <StaggerItem key={product.id} className="h-full">
          <ProductCard product={product} />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
