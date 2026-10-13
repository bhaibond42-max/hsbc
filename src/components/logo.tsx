const RATIO = 1186 / 1400;

export function HsbcLogo({
  size = 120,
  onDark = false,
  className,
}: {
  size?: number;
  onDark?: boolean;
  className?: string;
}) {
  const width = size;
  const height = Math.round(size * RATIO);
  return (
    <img
      src={onDark ? "/brand/hsbc-uk-logo-ondark.png" : "/brand/hsbc-uk-logo.png"}
      alt="HSBC UK"
      width={width}
      height={height}
      className={className}
      style={{ width, height, objectFit: "contain" }}
    />
  );
}
