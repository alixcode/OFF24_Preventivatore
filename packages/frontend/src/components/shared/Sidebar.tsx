"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  {
    section: "Principale",
    items: [
      { label: "Dashboard",       href: "/dashboard",          icon: "▪" },
      { label: "Nuovo preventivo",href: "/preventivi/nuovo",   icon: "+" },
      { label: "Preventivi",      href: "/preventivi",         icon: "◈" },
      { label: "Commesse",        href: "/commesse",           icon: "◉" },
    ],
  },
  {
    section: "Gestione",
    items: [
      { label: "Materiali",   href: "/materiali",    icon: "◫" },
      { label: "Fornitori",   href: "/fornitori",    icon: "◧" },
      { label: "Clienti",     href: "/clienti",      icon: "◦" },
    ],
  },
  {
    section: "Sistema",
    items: [
      { label: "Impostazioni", href: "/impostazioni", icon: "◌" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-bg-secondary border-r border-brand-border flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-brand-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-accent inline-block" />
          <span className="font-serif text-xl">OFF24</span>
        </div>
        <div className="text-[10px] text-brand-muted tracking-[2px] mt-0.5">PREVENTIVATORE</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((group) => (
          <div key={group.section} className="px-3 mb-2">
            <div className="text-[10px] text-brand-muted tracking-[1.5px] font-bold px-2 py-2">
              {group.section.toUpperCase()}
            </div>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 px-3 py-2.5 text-[13.5px] transition-colors border-l-2",
                    active
                      ? "text-accent border-accent bg-accent/8"
                      : "text-brand-subtle border-transparent hover:text-brand-text hover:bg-white/4"
                  )}
                >
                  <span className="w-4 text-center text-sm">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer utente */}
      <div className="p-4 border-t border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
            AB
          </div>
          <div>
            <div className="text-sm font-medium">Alice Brocca</div>
            <div className="text-xs text-brand-muted">Officina24 Srl</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
