import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // Import useLocation
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import RoutePlanner from "@/components/RoutePlanner";
import DestinationChooser from "@/components/DestinationChooser";
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
      <Hero />
      <section id="features">
        <FuelEstimator />
        <DestinationChooser />
      </section>
      <section id="danger">
        <RoutePlanner />
      </section>
      <section id="sustainability">
        <Dashboard />
      </section>
    </div>
  );
};

export default Index;
