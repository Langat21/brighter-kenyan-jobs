import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrapedJobCard from "@/components/ScrapedJobCard";
import { categories, locations } from "@/data/mockJobs";
import { useScrapedJobs } from "@/hooks/useScrapedJobs";

const jobTypes = ["Remote", "Hybrid", "On-site"];
const experienceLevels = ["Entry", "Mid", "Senior", "Executive"];

const Jobs = () => {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get("location") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"local" | "global">("local");

  // Scraped jobs from DB
  const { jobs: scrapedJobs, loading: scrapedLoading } = useScrapedJobs({
    query: activeTab === "global" ? query : undefined,
    category: activeTab === "global" ? selectedCategory : undefined,
    location: activeTab === "global" ? selectedLocation : undefined,
    limit: 200,
  });

  const filtered = useMemo(() => {
    return mockJobs.filter((job) => {
      if (query && !job.title.toLowerCase().includes(query.toLowerCase()) && !job.company.toLowerCase().includes(query.toLowerCase()) && !job.skills.some(s => s.toLowerCase().includes(query.toLowerCase()))) return false;
      if (selectedCategory && job.category !== selectedCategory) return false;
      if (selectedJobType && job.jobType !== selectedJobType) return false;
      if (selectedLevel && job.experienceLevel !== selectedLevel) return false;
      if (selectedLocation && job.location !== selectedLocation) return false;
      return true;
    });
  }, [query, selectedCategory, selectedJobType, selectedLevel, selectedLocation]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("");
    setSelectedJobType("");
    setSelectedLevel("");
    setSelectedLocation("");
  };

  const hasFilters = query || selectedCategory || selectedJobType || selectedLevel || selectedLocation;

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</h4>
        <div className="space-y-1">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(selectedCategory === cat.name ? "" : cat.name)}
              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                selectedCategory === cat.name ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "local" && (
        <>
          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Job Type</h4>
            <div className="flex flex-wrap gap-2">
              {jobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedJobType(selectedJobType === type ? "" : type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedJobType === type ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Experience</h4>
            <div className="flex flex-wrap gap-2">
              {experienceLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(selectedLevel === level ? "" : level)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    selectedLevel === level ? "bg-primary text-primary-foreground" : "border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</h4>
        <div className="space-y-1">
          {locations.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocation(selectedLocation === loc ? "" : loc)}
              className={`block w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                selectedLocation === loc ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Search bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
            <input
              type="text"
              placeholder="Search by title, company, or skill..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="md:hidden shrink-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-muted p-1 w-fit">
          <button
            onClick={() => setActiveTab("local")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "local"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇰🇪 Kenya Jobs
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "global"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Global Remote
          </button>
        </div>

        {hasFilters && (
          <div className="mb-4">
            <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <X className="h-3 w-3" /> Clear all filters
            </button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 md:block">
            <FilterPanel />
          </aside>

          {/* Mobile filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-background p-6 overflow-auto md:hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="h-5 w-5" /></button>
              </div>
              <FilterPanel />
              <Button className="mt-6 w-full bg-gradient-hero text-primary-foreground" onClick={() => setShowFilters(false)}>
                Show Results
              </Button>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {activeTab === "local" ? (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> jobs found
                </p>
                {filtered.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                    {filtered.map((job) => (
                      <JobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-lg font-semibold text-foreground">No jobs found</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{scrapedJobs.length}</span> remote jobs aggregated
                  {scrapedLoading && " · Loading..."}
                </p>
                {scrapedJobs.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                    {scrapedJobs.map((job) => (
                      <ScrapedJobCard key={job.id} job={job} />
                    ))}
                  </div>
                ) : scrapedLoading ? (
                  <div className="py-20 text-center">
                    <p className="text-lg font-semibold text-foreground">Loading remote jobs...</p>
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-lg font-semibold text-foreground">No remote jobs yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Jobs are scraped every 4 hours from Remotive, Arbeitnow & RemoteOK
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
