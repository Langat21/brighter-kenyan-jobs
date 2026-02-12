import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedJobs from "@/components/FeaturedJobs";
import StatsSection from "@/components/StatsSection";
import WhySection from "@/components/WhySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <CategoriesSection />
        <FeaturedJobs />
        <WhySection />
        <StatsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
