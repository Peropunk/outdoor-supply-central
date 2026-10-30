import Image from "next/image";
import Link from "next/link";
import { Search, User } from "lucide-react";
import { MobileMenu } from "./MobileMenu";
import { buttonClass } from "./ui";

export const NAV = [
  { href: "/browse", label: "Shop" },
  { href: "/sell", label: "Sell your gear" },
  { href: "/help/how-to-sell", label: "How it works" },
  { href: "/help", label: "Help" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20">
        <Link href="/" className="shrink-0" aria-label="Outdoor Supply Central home">
          <Image
            src="/brand/logo.jpg"
            alt="Outdoor Supply Central"
            width={300}
            height={83}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.slice(0, 3).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label-caps text-[14px] text-ink no-underline hover:text-pine"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-4">
          <Link
            href="/browse"
            aria-label="Search gear"
            className="flex size-12 items-center justify-center rounded-md text-ink hover:bg-sand"
          >
            <Search className="size-6" aria-hidden="true" />
          </Link>
          <Link
            href="/signin"
            aria-label="Sign in or your account"
            className="flex size-12 items-center justify-center rounded-md text-ink hover:bg-sand max-md:hidden"
          >
            <User className="size-6" aria-hidden="true" />
          </Link>
          <Link href="/sell" className={buttonClass("primary", "ml-2 min-h-11 px-5 max-md:hidden")}>
            Sell gear
          </Link>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
