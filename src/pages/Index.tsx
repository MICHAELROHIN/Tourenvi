import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import TripCalculator from "@/components/TripCalculator";
import RoutePlanner from "@/components/RoutePlanner";
import SustainabilityInsights from "@/components/SustainabilityInsights";
import DestinationChooser from "@/components/DestinationChooser";
import GetStarted from "@/components/GetStarted";
import Dashboard from "@/components/Dashboard";
import FuelEstimator from "@/components/FuelEstimator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <GetStarted />
      <TripCalculator />
      <FuelEstimator />
      <DestinationChooser />
      <RoutePlanner />
      <SustainabilityInsights />
      <Dashboard />
    </div>
  );
};

export default Index;
