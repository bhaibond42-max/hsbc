"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { serviceSections } from "@/lib/services";
import { serviceIcons } from "@/components/home-service-icons";

export function HomeServices() {
  return (
    <div className="mt-6 space-y-6">
      {serviceSections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-charcoal">{section.title}</h2>
          <div className="grid grid-cols-4 gap-x-2 gap-y-5 sm:gap-x-3">
            {section.items.map((entry) => {
              const Icon = serviceIcons[entry.icon] ?? Wallet;
              return (
                <Link
                  key={entry.slug}
                  href={entry.href}
                  className="press focus-ring flex flex-col items-center gap-2 rounded-md py-1 text-center hover:bg-brand-soft/50"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-lg border border-line bg-surface text-brand sm:h-[3.75rem] sm:w-[3.75rem]">
                    <Icon size={24} strokeWidth={1.75} />
                  </span>
                  <span className="max-w-[5.25rem] text-xs font-medium leading-tight text-charcoal">{entry.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
