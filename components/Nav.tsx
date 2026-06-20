"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <nav className="border-b border-slate-800 px-4 py-3 flex items-center gap-6">
      <Link href="/search" className="font-bold text-slate-100 text-lg tracking-tight">
        hashit
      </Link>
      <div className="flex items-center gap-5 text-sm flex-1">
        <NavLink href="/search" active={pathname.startsWith("/search") || pathname.startsWith("/content")}>
          Search
        </NavLink>
      </div>
      <button
        onClick={logout}
        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        Sign out
      </button>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={active ? "text-slate-100" : "text-slate-400 hover:text-slate-200 transition-colors"}
    >
      {children}
    </Link>
  );
}
