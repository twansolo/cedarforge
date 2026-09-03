import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm font-semibold tracking-tight"
        >
          <Image
            src="/logo-kit/Cedar-Forge-Icon.svg"
            alt=""
            aria-hidden="true"
            width={28}
            height={28}
            className="size-7"
            priority
          />
          <span>Cedar Forge</span>
        </Link>

        <nav aria-label="Main">
          <ul className="flex items-center gap-1 text-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-md px-3 py-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
