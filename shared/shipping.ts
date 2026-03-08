export const SHIPPING_MILESTONES = [
  { key: "order_confirmed", label: "Order Confirmed", description: "Payment received, order confirmed" },
  { key: "packaging", label: "Packaging", description: "Seller is preparing and packaging your goods" },
  { key: "shipped", label: "Shipped", description: "Package has been shipped from seller location" },
  { key: "in_transit", label: "In Transit", description: "Package is on the way to destination country" },
  { key: "customs_clearance", label: "Customs Clearance", description: "Package is clearing customs at destination border" },
  { key: "local_hub", label: "Local Delivery Hub", description: "Package arrived at local delivery hub" },
  { key: "out_for_delivery", label: "Out for Delivery", description: "Package is out for delivery to your address" },
  { key: "delivered", label: "Delivered", description: "Package has been delivered" },
] as const;

export type ShippingMilestoneKey = typeof SHIPPING_MILESTONES[number]["key"];

export const VALID_SHIPMENT_STATUSES: ShippingMilestoneKey[] = SHIPPING_MILESTONES.map(m => m.key);

export function getMilestoneIndex(status: string): number {
  return SHIPPING_MILESTONES.findIndex(m => m.key === status);
}

export function getMilestoneProgress(status: string): number {
  const idx = getMilestoneIndex(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / SHIPPING_MILESTONES.length) * 100);
}

export function getMilestoneLabel(status: string): string {
  const milestone = SHIPPING_MILESTONES.find(m => m.key === status);
  return milestone?.label || status;
}

export function isValidMilestoneTransition(current: string, next: string): boolean {
  const currentIdx = getMilestoneIndex(current);
  const nextIdx = getMilestoneIndex(next);
  if (currentIdx === -1 || nextIdx === -1) return false;
  return nextIdx > currentIdx;
}

export const CROSS_BORDER_TRANSIT_DAYS: Record<string, number> = {
  "same_country": 3,
  "neighboring": 5,
  "same_region": 7,
  "cross_continent": 14,
  "default": 10,
};

export function estimateTransitDays(originCountry: string, destCountry: string, priority: string = "standard"): number {
  let baseDays: number;
  if (originCountry === destCountry) {
    baseDays = CROSS_BORDER_TRANSIT_DAYS.same_country;
  } else {
    baseDays = CROSS_BORDER_TRANSIT_DAYS.default;
  }
  
  if (priority === "express") baseDays = Math.ceil(baseDays * 0.6);
  if (priority === "fastest") baseDays = Math.ceil(baseDays * 0.4);
  
  return baseDays;
}

export const STALE_SHIPMENT_HOURS = 24;
export const AUTO_DISPUTE_DAYS = 5;
export const BUYER_PROTECTION_ESCROW_HOLD_DAYS = 14;
