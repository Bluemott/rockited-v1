'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WooProduct } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye } from 'lucide-react';
import { toast } from 'sonner';
import ShareButton from '@/components/ui/ShareButton';
import { getSiteConfig } from '@/lib/seo';
import QuickViewDialog from './QuickViewDialog';

interface ProductCardProps {
  product: WooProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.images[0]?.src || '/placeholder-product.jpg',
      sku: product.sku,
    });
    toast.success(`${product.name} added to cart`);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(price));
  };

  const getStockStatus = () => {
    switch (product.stock_status) {
      case 'instock':
        return { text: 'In Stock', variant: 'default' as const };
      case 'outofstock':
        return { text: 'Out of Stock', variant: 'destructive' as const };
      case 'onbackorder':
        return { text: 'On Backorder', variant: 'secondary' as const };
      default:
        return { text: 'Unknown', variant: 'outline' as const };
    }
  };

  const stockStatus = getStockStatus();
  const siteConfig = getSiteConfig();
  const productUrl = `${siteConfig.url}/products/${product.slug}`;
  const productDescription = product.short_description?.replace(/<[^>]*>/g, '') || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group w-full h-full"
    >
      <Card className="h-full w-full flex flex-col overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="relative overflow-hidden">
          <Link href={`/products/${product.slug}`}>
            <div className="aspect-square relative">
              <Image
                src={product.images[0]?.src || '/placeholder-product.jpg'}
                alt={product.images[0]?.alt || product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>
          
          {product.on_sale && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2 z-10"
            >
              Sale
            </Badge>
          )}
          
          <div className="absolute top-2 right-2 z-10">
            <ShareButton
              url={productUrl}
              title={product.name}
              description={productDescription}
              image={product.images[0]?.src}
              platforms={['pinterest', 'copy']}
            />
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300"
          >
            {/* Base overlay for overall contrast */}
            <div className="absolute inset-0 bg-black/40" />
            
            {/* Radial gradient overlay - darker in center where button is */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)'
              }}
            />
            
            {/* Button with enhanced styling */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsQuickViewOpen(true)}
              className="rounded-full relative z-10 shadow-lg border-2 border-white/20 text-white hover:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </motion.div>
        </div>
        
        <CardHeader className="space-y-2">
          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          
          {product.short_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.short_description.replace(/<[^>]*>/g, '')}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.on_sale && product.regular_price !== product.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.regular_price)}
                  </span>
                )}
              </div>
              <Badge variant={stockStatus.variant} className="text-xs">
                {stockStatus.text}
              </Badge>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted flex gap-2 w-full min-w-0 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-0 hover:bg-muted hover:text-foreground hover:border-muted-foreground"
            asChild
          >
            <Link href={`/products/${product.slug}`} className="truncate">
              View Details
            </Link>
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={product.stock_status === 'outofstock'}
            variant="default"
            className="flex-1 min-w-0"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">
              {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </Button>
        </CardFooter>
      </Card>
      
      <QuickViewDialog
        product={product}
        open={isQuickViewOpen}
        onOpenChange={setIsQuickViewOpen}
      />
    </motion.div>
  );
}
