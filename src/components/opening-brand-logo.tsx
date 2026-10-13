const OPENING_LOGO_SRC = "/brand/hsbc-splash-uk.png";

export function OpeningBrandLogo({ size = 140 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={OPENING_LOGO_SRC}
      alt="HSBC UK"
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: "auto", maxWidth: "min(200px, 52vw)" }}
      draggable={false}
    />
  );
}

export function OpeningSplashScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center bg-brand px-6">
      <OpeningBrandLogo size={160} />
      {message ? <p className="mt-10 text-xs font-medium tracking-wide text-white/85">{message}</p> : null}
    </div>
  );
}
