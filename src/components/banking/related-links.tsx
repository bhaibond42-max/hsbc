import Link from "next/link";
import { serviceSections } from "@/lib/services";
import { Card, SectionHeader } from "@/components/ui";

export function RelatedServices({ slug, limit = 4 }: { slug: string; limit?: number }) {
  const section = serviceSections.find((entry) => entry.items.some((item) => item.slug === slug));
  if (!section) return null;
  const related = section.items.filter((item) => item.slug !== slug).slice(0, limit);
  if (related.length === 0) return null;
  return (
    <Card padding="md">
      <SectionHeader title="Related in this section" description="Shortcuts to nearby features." />
      <ul className="mt-2 divide-y divide-line">
        {related.map((item) => (
          <li key={item.slug}>
            <Link href={item.href} className="flex items-center justify-between py-3 text-sm hover:text-brand">
              <span className="font-medium text-charcoal">{item.label}</span>
              <span className="text-muted">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
