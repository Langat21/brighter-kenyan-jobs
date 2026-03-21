import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Bookmark, BadgeCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import MpesaPaymentModal from "@/components/MpesaPaymentModal";
import { toast } from "sonner";
import { type Job } from "@/data/mockJobs";

const typeColors: Record<string, string> = {
  Remote: "bg-secondary/10 text-secondary",
  Hybrid: "bg-accent/20 text-accent-foreground",
  "On-site": "bg-primary/10 text-primary",
};

const JobCard = ({ job }: { job: Job }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSubscribed, recordSubscription } = useSubscription();
  const [paymentOpen, setPaymentOpen] = useState(false);

  const salaryLabel = `KES ${(job.salaryMin / 1000).toFixed(0)}K – ${(job.salaryMax / 1000).toFixed(0)}K`;
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000));

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
    navigate(`/jobs/${job.id}`);
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="group block rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
              {job.companyLogo}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground truncate">{job.company}</span>
                {job.verified && <BadgeCheck className="h-3.5 w-3.5 text-secondary shrink-0" />}
              </div>
              <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                {job.title}
              </h3>
            </div>
          </div>
          <button
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={(e) => { e.stopPropagation(); }}
            aria-label="Save job"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-medium ${typeColors[job.jobType] || "bg-muted text-muted-foreground"}`}>
            {job.jobType}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            {job.employmentType}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
            {job.experienceLevel}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">{salaryLabel}</span>
          <span className="text-xs text-muted-foreground">/month</span>
        </div>
      </div>

      <MpesaPaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        amount={49}
        amountLabel="Weekly Subscription"
        onPaymentSuccess={async (transactionId) => {
          await recordSubscription(transactionId);
          toast.success("Subscription active! You can now access all jobs.");
          setPaymentOpen(false);
          navigate(`/jobs/${job.id}`);
        }}
      />
    </>
  );
};

export default JobCard;
