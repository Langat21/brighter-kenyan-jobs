import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { mockJobs } from "@/data/mockJobs";
import JobCard from "@/components/JobCard";
import { motion } from "framer-motion";

const FeaturedJobs = () => {
  const featured = mockJobs.slice(0, 6);

  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Latest Opportunities
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh job postings from verified Kenyan employers
            </p>
          </div>
          <Link
            to="/jobs"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View All Jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <JobCard job={job} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View All Jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
