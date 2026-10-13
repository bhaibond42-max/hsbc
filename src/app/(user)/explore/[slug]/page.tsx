"use client";

import { useParams } from "next/navigation";
import { Wallet } from "lucide-react";
import { findService } from "@/lib/services";
import { exploreHeroForSlug } from "@/lib/explore-visuals";
import { ServiceDetailScreen } from "@/components/service-detail-screen";
import { BankingPageIntro } from "@/components/page-intro";
import { serviceIcons } from "@/components/home-service-icons";
import { EmptyState, PageHeader } from "@/components/ui";

export default function ExplorePage() {
  const params = useParams<{ slug: string }>();
  const item = findService(params.slug);

  if (!item) {
    return (
      <div>
        <PageHeader title="Not found" back="/home" />
        <div className="px-4">
          <EmptyState title="That service is not listed" body="Go back to home and choose another icon." />
        </div>
      </div>
    );
  }

  const Icon = serviceIcons[item.icon] ?? Wallet;
  const hero = exploreHeroForSlug(item.slug);

  return (
    <div className="md:pt-2">
      <PageHeader title={item.label} back="/home" />
      <div className="space-y-5 px-4 md:px-0">
        <BankingPageIntro title={item.label} description={item.summary} icon={Icon} imageSrc={hero} />
        <ServiceDetailScreen item={item} />
      </div>
    </div>
  );
}
