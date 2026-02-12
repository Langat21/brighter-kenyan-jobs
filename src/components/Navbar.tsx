import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Briefcase, Menu, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
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
          <Button variant="ghost" size="sm">
            Log In
          </Button>
          <Button size="sm" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
            Sign Up
          </Button>
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
            <Link
              to="/jobs"
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              Find Jobs
            </Link>
            <Link
              to="/jobs"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              For Employers
            </Link>
            <Link
              to="/jobs"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              Pricing
            </Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" size="sm" className="w-full">
              Log In
            </Button>
            <Button size="sm" className="w-full bg-gradient-hero text-primary-foreground">
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
