"use client";

import type { ServiceItem } from "@/lib/services";
import { ExploreContent } from "@/components/explore/explore-content";

export function ServiceDetailScreen({ item }: { item: ServiceItem }) {
  return <ExploreContent item={item} />;
}
