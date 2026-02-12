import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Building, BadgeCheck, Bookmark, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/JobCard";
import { mockJobs } from "@/data/mockJobs";

const JobDetail = () => {
  const { id } = useParams();
  const job = mockJobs.find((j) => j.id === id);

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg font-semibold text-foreground">Job not found</p>
          <Link to="/jobs" className="mt-2 text-sm text-primary hover:underline">Back to jobs</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const salaryLabel = `KES ${(job.salaryMin / 1000).toFixed(0)}K – ${(job.salaryMax / 1000).toFixed(0)}K`;
  const daysAgo = Math.max(0, Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000));
  const similar = mockJobs.filter((j) => j.id !== job.id && j.category === job.category).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Link to="/jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold text-foreground">
                  {job.companyLogo}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{job.company}</span>
                    {job.verified && <BadgeCheck className="h-4 w-4 text-secondary" />}
                  </div>
                  <h1 className="text-xl font-bold text-foreground sm:text-2xl">{job.title}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" />{job.jobType} · {job.employmentType}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{daysAgo === 0 ? "Posted today" : `${daysAgo} days ago`}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-lg font-bold text-foreground">{salaryLabel}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-9 w-9"><Bookmark className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" className="h-9 w-9"><Share2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Job Description</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Requirements</h2>
                <ul className="space-y-1.5">
                  {job.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{skill}</span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">Benefits</h2>
                <div className="flex flex-wrap gap-2">
                  {job.benefits.map((b) => (
                    <span key={b} className="rounded-full border border-secondary/30 bg-secondary/5 px-3 py-1 text-xs font-medium text-secondary">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card sticky top-20">
              <Button className="w-full bg-gradient-accent text-secondary-foreground hover:opacity-90 text-base py-5">
                Apply Now — KES 99
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                or <button className="text-primary hover:underline">subscribe for KES 499/mo</button> for unlimited
              </p>

              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium text-foreground">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium text-foreground">{job.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline</span>
                  <span className="font-medium text-foreground">{new Date(job.deadline).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Applicants</span>
                  <span className="font-medium text-foreground">{job.applicationsCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar jobs */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-foreground">Similar Jobs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((j) => <JobCard key={j.id} job={j} />)}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JobDetail;
