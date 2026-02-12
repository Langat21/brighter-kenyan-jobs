import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const popularSearches = ["Frontend Developer", "Remote", "Marketing", "Data Analyst", "Nairobi"];

const HeroSection = () => {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/jobs?q=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background image overlay */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-primary/95" />
      </div>

      <div className="container relative mx-auto px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-block rounded-full bg-secondary/20 px-4 py-1.5 text-xs font-semibold text-secondary mb-6">
            🇰🇪 Kenya's #1 Job Platform
          </span>
          <h1 className="text-3xl font-extrabold leading-tight text-primary-foreground sm:text-4xl md:text-5xl lg:text-6xl">
            Find Your Dream Job{" "}
            <span className="text-accent">in Kenya</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/70 sm:text-lg">
            Browse thousands of verified remote, hybrid and on-site opportunities from top Kenyan and international companies.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSearch}
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl bg-card/95 p-3 shadow-elevated backdrop-blur-sm sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Job title or keyword..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Location or Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <Button
            type="submit"
            className="bg-gradient-accent text-secondary-foreground hover:opacity-90 px-6 shrink-0"
          >
            Search Jobs
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2 text-xs"
        >
          <span className="text-primary-foreground/50">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => { setKeyword(term); navigate(`/jobs?q=${encodeURIComponent(term)}`); }}
              className="rounded-full border border-primary-foreground/20 px-3 py-1 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10"
            >
              {term}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
