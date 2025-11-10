import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calculator, BarChart3, Sparkles, Leaf } from "lucide-react";

const GetStarted = () => {
  const steps = [
    {
      icon: Calculator,
      title: "Enter Trip Details",
      desc: "Add distance, fuel, stay and tolls to estimate your budget.",
      href: "#calculator",
      cta: "Open Calculator",
    },
    {
      icon: Sparkles,
      title: "Pick Destinations",
      desc: "Use Destination Genie to discover places that match your vibe.",
      href: "#locgenie",
      cta: "Explore Genie",
    },
    {
      icon: MapPin,
      title: "Plan Your Route",
      desc: "See blue routes on the map and open full Google Maps for navigation.",
      href: "#routes",
      cta: "Plan Route",
    },
    {
      icon: BarChart3,
      title: "Review Dashboard",
      desc: "View saved routes and last trip summary, resume planning anytime.",
      href: "#dashboard",
      cta: "Go to Dashboard",
    },
  ];

  return (
    <section id="get-started" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Get Started</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your trip in four quick steps</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Follow this flow to plan, visualize, and share your journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {steps.map((s, idx) => (
            <Card key={idx} className="shadow-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <s.icon className="w-5 h-5 text-primary" />
                  <span>{s.title}</span>
                </CardTitle>
                <CardDescription>{s.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => window.location.assign(s.href)} className="w-full">
                  {s.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GetStarted;
