import { motion } from "framer-motion";

const stats = [
  { label: "Active Jobs", value: "2,500+", icon: "💼" },
  { label: "Companies", value: "850+", icon: "🏢" },
  { label: "Successful Hires", value: "12,000+", icon: "🤝" },
  { label: "Job Seekers", value: "50,000+", icon: "👥" },
];

const StatsSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <span className="text-3xl">{stat.icon}</span>
              <p className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
