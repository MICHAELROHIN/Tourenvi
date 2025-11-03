import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, MapPin, DollarSign } from "lucide-react";
import heroImage from "@/assets/hero-travel.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Sustainable travel with electric car on scenic mountain road"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-border shadow-card">
            <Leaf className="w-4 h-4 text-eco-green" />
            <span className="text-sm font-medium text-foreground">Sustainable Travel Planning</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Smart Travel,
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Sustainable Future</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-green-900 text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Plan your perfect trip with AI-powered cost estimation, eco-friendly route optimization, 
            and personalized recommendations that care for both your wallet and the planet.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="px-8 py-4 text-lg shadow-hero hover:shadow-xl transition-all duration-300">
              Start Planning Your Trip
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg bg-background/90 backdrop-blur-sm border-2">
              Watch Demo
            </Button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-6 shadow-card">
              <DollarSign className="w-8 h-8 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Cost Estimation</h3>
                <p className="text-sm text-muted-foreground">Precise trip budgeting</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-6 shadow-card">
              <MapPin className="w-8 h-8 text-accent" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Smart Routes</h3>
                <p className="text-sm text-muted-foreground">Optimized pathfinding</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-3 bg-background/90 backdrop-blur-sm rounded-xl p-6 shadow-card">
              <Leaf className="w-8 h-8 text-eco-green" />
              <div className="text-left">
                <h3 className="font-semibold text-foreground">Eco-Friendly</h3>
                <p className="text-sm text-muted-foreground">Sustainable travel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;