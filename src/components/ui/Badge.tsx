type BadgeProps = {
  children: React.ReactNode;
  tone?: "primary" | "dark" | "muted" | "sale";
  className?: string;
};

const tones = {
  primary: "bg-north-primary text-white",
  dark: "bg-north-dark text-white",
  muted: "bg-north-border text-north-dark",
  sale: "bg-north-dark-blue text-white",
};

export function Badge({
  children,
  tone = "primary",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
