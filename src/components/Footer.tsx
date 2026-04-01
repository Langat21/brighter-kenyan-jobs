import { Link } from "react-router-dom";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-foreground">
                Brighter<span className="text-secondary">Jobs</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Kenya's premier job platform connecting talent with opportunity. Find your dream job today.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Browse Jobs</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Remote Jobs</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Salary Guide</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Career Tips</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">For Employers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Post a Job</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">Employer Branding</Link></li>
              <li><Link to="/jobs" className="hover:text-foreground transition-colors">API Access</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © 2026 BrighterJobs. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ in Kenya 🇰🇪
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
