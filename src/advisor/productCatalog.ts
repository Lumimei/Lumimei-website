/**
 * productCatalog.ts
 * Lumimei Advisor Product Catalog and Definitions
 * Strictly bound to the single source of truth in products.ts
 */

import { Product } from '../types';
import { getProductByIdOrFallback } from '../data/products';

export type ProductId = 'rice_mask' | 'serum' | 'coconut_oil' | 'soap';

export interface AdvisorProduct {
  id: ProductId;
  storeProductId: string; // references store catalog p1, p2, p3, p4
  nameKm: string;
  nameEn: string;
  nameZh: string;
  shortTaglineKm: string;
  tags: string[];
  priceUsd: number;
  image: string;
  volume: string;
}

export function buildAdvisorProduct(
  id: ProductId,
  storeProductId: string,
  tags: string[],
  fallbackTagline: string,
  catalog?: Product[]
): AdvisorProduct {
  const p = getProductByIdOrFallback(storeProductId, catalog);
  return {
    id,
    storeProductId,
    nameKm: p.nameKm || p.name,
    nameEn: p.name,
    nameZh: p.nameZh || p.name,
    shortTaglineKm: p.descriptionKm || fallbackTagline,
    tags,
    priceUsd: p.priceUsd,
    image: p.image,
    volume: p.volume || '',
  };
}

export function getAdvisorProductMap(catalog?: Product[]): Record<ProductId, AdvisorProduct> {
  return {
    rice_mask: buildAdvisorProduct(
      'rice_mask',
      'p1',
      ['oil_control', 'texture_support', 'exfoliation_support', 'deep_cleansing'],
      'បឺតជាតិពុល សម្អាតរន្ធញើស និងកាត់បន្ថយខ្លាញ់',
      catalog
    ),
    serum: buildAdvisorProduct(
      'serum',
      'p2',
      ['hydration', 'barrier_support', 'skin_comfort', 'post_acne_mark_support'],
      'ផ្ដល់សំណើម ស្ដាររបាំងស្បែក និងបំប៉នស្នាមមុន',
      catalog
    ),
    coconut_oil: buildAdvisorProduct(
      'coconut_oil',
      'p3',
      ['makeup_removal', 'first_cleanse', 'moisture_support'],
      'ជួយលាងសម្អាតគ្រឿងសម្អាង និងផ្ដល់សំណើមស្បែក',
      catalog
    ),
    soap: buildAdvisorProduct(
      'soap',
      'p4',
      ['daily_cleansing', 'basic_care', 'oil_control'],
      'លាងសម្អាតប្រចាំថ្ងៃ កាត់បន្ថយខ្លាញ់ និងបាក់តេរី',
      catalog
    ),
  };
}

// Backwards-compatible export that retrieves current products from shared source
export const ADVISOR_PRODUCTS: Record<ProductId, AdvisorProduct> = new Proxy(
  {} as Record<ProductId, AdvisorProduct>,
  {
    get: (_target, prop: string) => {
      const map = getAdvisorProductMap();
      return map[prop as ProductId];
    },
    ownKeys: () => ['rice_mask', 'serum', 'coconut_oil', 'soap'],
    getOwnPropertyDescriptor: (_target, prop) => ({
      value: getAdvisorProductMap()[prop as ProductId],
      enumerable: true,
      configurable: true,
    }),
  }
);
