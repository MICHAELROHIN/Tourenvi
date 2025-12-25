import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import Navigation from "@/components/Navigation";
import RoutePlanner from "@/components/RoutePlanner";
import SustainabilityInsights from "@/components/SustainabilityInsights";
import DestinationChooser from "@/components/DestinationChooser";
import GetStarted from "@/components/GetStarted";
import Dashboard from "@/components/Dashboard";
import FuelEstimator from "@/components/FuelEstimator";

const Index = () => {

  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); 
    }
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <GetStarted />
      <FuelEstimator />
      <DestinationChooser />
      <RoutePlanner />
      <SustainabilityInsights />
      <Dashboard />
    </div>
  );
};

export default Index;