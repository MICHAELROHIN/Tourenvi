import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TripCalculator from "@/components/TripCalculator";
import RoutePlanner from "@/components/RoutePlanner";
import SustainabilityInsights from "@/components/SustainabilityInsights";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <TripCalculator />
      <RoutePlanner />
      <SustainabilityInsights />
    </div>
  );
};

export default Index;