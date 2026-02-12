import { ShieldCheck, Globe, CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    title: "Verified Jobs Only",
    description: "Every listing is reviewed and verified to protect you from scams.",
  },
  {
    icon: Globe,
    title: "Local & Remote",
    description: "Find jobs across Kenya or work remotely for international companies.",
  },
  {
    icon: CreditCard,
    title: "Pay via M-PESA",
    description: "Seamless applications with Kenya's most trusted payment method.",
  },
  {
    icon: Zap,
    title: "Apply in Seconds",
    description: "One-click applications with your saved profile and resume.",
  },
];

const WhySection = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Why BrighterJobs?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Built for Kenyan professionals, by Kenyan professionals.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-6 text-center shadow-card"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                <feat.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{feat.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhySection;
