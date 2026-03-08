import memoizee from "memoizee";
import { storage, type IStorage } from "./storage";
import type { Category, Product } from "@shared/schema";

const CATEGORY_TTL = 5 * 60 * 1000;
const FEATURED_TTL = 60 * 1000;
const PRODUCT_TTL = 30 * 1000;

const getCategoriesCached = memoizee(
  async (): Promise<Category[]> => {
    return storage.getCategories();
  },
  { promise: true, maxAge: CATEGORY_TTL, preFetch: 0.5 }
);

const getFeaturedProductsCached = memoizee(
  async (): Promise<Product[]> => {
    return storage.getFeaturedProducts();
  },
  { promise: true, maxAge: FEATURED_TTL, preFetch: 0.5 }
);

const getProductCached = memoizee(
  async (id: number): Promise<Product | undefined> => {
    return storage.getProduct(id);
  },
  { promise: true, maxAge: PRODUCT_TTL, max: 1000, preFetch: 0.5 }
);

export const cachedStorage = {
  getCategories: getCategoriesCached,
  getFeaturedProducts: getFeaturedProductsCached,
  getProduct: getProductCached,
  
  invalidateCategories: () => getCategoriesCached.clear(),
  invalidateFeaturedProducts: () => getFeaturedProductsCached.clear(),
  invalidateProduct: (id: number) => getProductCached.delete(id),
  invalidateAllProducts: () => getProductCached.clear(),
};

export function invalidateAllCaches(): void {
  getCategoriesCached.clear();
  getFeaturedProductsCached.clear();
  getProductCached.clear();
}
