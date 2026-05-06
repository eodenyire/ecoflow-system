import { Link, useRouter } from "@tanstack/react-router";
import { Leaf, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-leaf text-primary-foreground shadow-glow">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Taka<span className="text-accent">Flow</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="/#ecosystem" className="transition-colors hover:text-foreground">Ecosystem</a>
          <a href="/#impact" className="transition-colors hover:text-foreground">Impact</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><UserIcon className="mr-1 h-4 w-4" />Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
              <Button asChild size="sm" className="bg-gradient-leaf text-primary-foreground hover:opacity-90"><Link to="/auth">Get started</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
