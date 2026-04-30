import Link from "next/link";

interface TopbarProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string };
}

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <div className="sticky top-0 z-20 bg-bg-secondary border-b border-brand-border px-8 py-4 flex items-center justify-between">
      <div>
        {subtitle && <div className="text-xs text-brand-muted mb-1">{subtitle}</div>}
        <h1 className="font-serif text-2xl">{title}</h1>
      </div>
      {action && (
        <Link href={action.href} className="btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
