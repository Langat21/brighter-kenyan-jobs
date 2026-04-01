import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ExternalLink, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import MpesaPaymentModal from "@/components/MpesaPaymentModal";
import { toast } from "sonner";
import type { ScrapedJob } from "@/hooks/useScrapedJobs";

const sourceColors: Record<string, string> = {
  remotive: "bg-secondary/10 text-secondary",
  arbeitnow: "bg-primary/10 text-primary",
  remoteok: "bg-accent/20 text-accent-foreground",
  brightermonday: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  myjobmag: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  fuzu: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  linkedin: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
};

const ScrapedJobCard = ({ job }: { job: ScrapedJob }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, recordSubscription } = useSubscription();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const daysAgo = job.posted_at
    ? Math.max(0, Math.floor((Date.now() - new Date(job.posted_at).getTime()) / 86400000))
    : null;

  const salaryLabel =
    job.salary_min && job.salary_max
      ? `$${(job.salary_min / 1000).toFixed(0)}K – $${(job.salary_max / 1000).toFixed(0)}K`
      : null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info("Please sign in to access job listings");
      navigate("/auth");
      return;
    }
    if (!isSubscribed) {
      setPaymentOpen(true);
      return;
    }
    window.open(job.source_url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer overflow-hidden"
      >
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
              {job.company.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm text-muted-foreground truncate block">{job.company}</span>
              <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 break-words">
                {job.title}
              </h3>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${sourceColors[job.source] || "bg-muted text-muted-foreground"}`}>
            {job.source}
          </span>
          {job.category && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              {job.category}
            </span>
          )}
          {job.seniority && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              {job.seniority}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          {daysAgo !== null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" />
            {job.source}
          </span>
        </div>

        {salaryLabel && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{salaryLabel}</span>
            <span className="text-xs text-muted-foreground">/year</span>
          </div>
        )}

        {job.tags && job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <MpesaPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={49}
        amountLabel="Weekly Subscription"
        onPaymentSuccess={async (transactionId) => {
          await recordSubscription(transactionId);
          toast.success("Subscription active! Opening job...");
          setPaymentOpen(false);
          window.open(job.source_url, "_blank", "noopener,noreferrer");
        }}
      />
    </>
  );
};

export default ScrapedJobCard;
