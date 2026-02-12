import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categories } from "@/data/mockJobs";
import { motion } from "framer-motion";

const CategoriesSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Browse by Category
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Explore opportunities across top industries in Kenya
            </p>
          </div>
          <Link
            to="/jobs"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/jobs?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                <span className="mt-1 text-xs text-muted-foreground">{cat.count} jobs</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
