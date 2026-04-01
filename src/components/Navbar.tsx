import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Briefcase, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { profile } = useUserProfile();

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-foreground">
            Brighter<span className="text-secondary">Jobs</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            to="/jobs"
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted ${
              location.pathname === "/jobs" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            Find Jobs
          </Link>
          <Link
            to="/jobs"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            For Employers
          </Link>
          <Link
            to="/jobs"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Pricing
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-1.5 text-secondary">
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{profile?.display_name || user.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                Log In
              </Button>
              <Button size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90" onClick={() => navigate("/auth")}>
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            <Link to="/jobs" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setMobileOpen(false)}>Find Jobs</Link>
            <Link to="/jobs" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted" onClick={() => setMobileOpen(false)}>For Employers</Link>
            <Link to="/jobs" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted" onClick={() => setMobileOpen(false)}>Pricing</Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">{profile?.display_name || user.email}</span>
                </div>
                {isAdmin && (
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-secondary" onClick={() => { navigate("/admin"); setMobileOpen(false); }}>
                    <Shield className="h-4 w-4" />
                    Admin Panel
                  </Button>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={() => { signOut(); setMobileOpen(false); }}>
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Log In</Button>
                <Button size="sm" className="w-full bg-gradient-hero text-primary-foreground" onClick={() => { navigate("/auth"); setMobileOpen(false); }}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
