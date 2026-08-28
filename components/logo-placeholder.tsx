export function LogoPlaceholder({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`logo-placeholder ${className}`}
      role="img"
      aria-label={`${label} image coming soon`}
    >
      <img src="/beata-logo.png" alt="" />
      <span>Collection imagery coming soon</span>
    </div>
  );
}
