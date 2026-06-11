import {
  ProductCard as StoreProductCard,
  ProductDetail,
  ProductGrid,
} from "@/components/store/product-components";

export { AppShell, SectionHeader } from "@/components/ui";
export { ProductDetail, ProductGrid };
export const ProductCard = {
  Card: StoreProductCard,
  Grid: ProductGrid,
};
