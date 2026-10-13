import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

export function BankingPageIntro({
  title,
  description,
  icon: Icon,
  imageSrc,
  className,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  imageSrc?: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "relative mb-6 overflow-hidden rounded-lg border border-line bg-gradient-to-br from-brand-soft via-surface to-mist",
        className,
      )}
    >
      <div className="absolute -right-6 -top-8 h-40 w-40 rounded-full bg-brand/5" aria-hidden />
      <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/80 to-transparent" aria-hidden />
      <div className="relative flex gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
            <Icon size={22} strokeWidth={1.75} aria-hidden />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-charcoal sm:text-xl">{title}</h2>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">{description}</p>
        </div>
        {imageSrc ? (
          <div className="relative hidden h-28 w-36 shrink-0 sm:block">
            <Image src={imageSrc} alt="" fill className="object-contain object-right" sizes="144px" priority={false} />
          </div>
        ) : null}
      </div>
      <div className="h-1 bg-brand" aria-hidden />
    </div>
  );
}
