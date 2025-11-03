import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TripCalculator from "@/components/TripCalculator";
import RoutePlanner from "@/components/RoutePlanner";
import SustainabilityInsights from "@/components/SustainabilityInsights";
import DestinationChooser from "@/components/DestinationChooser";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <TripCalculator />
      <DestinationChooser />
      <RoutePlanner />
      <SustainabilityInsights />
    </div>
  );
};

export default Index;
