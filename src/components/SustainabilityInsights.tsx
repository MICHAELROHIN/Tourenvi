import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Leaf, Zap, TreePine, Droplets, Recycle, Award } from "lucide-react";

const SustainabilityInsights = () => {
  const ecoTips = [
    {
      icon: Zap,
      title: "EV Charging Stations",
      description: "Find 15 charging stations along your route",
      impact: "Reduce emissions by 65%",
      color: "text-yellow-600"
    },
    {
      icon: TreePine,
      title: "Carbon Offset Options",
      description: "Offset 50kg CO₂ for just $12",
      impact: "Plant 2 trees equivalent",
      color: "text-green-600"
    },
    {
      icon: Droplets,
      title: "Water Conservation",
      description: "Choose hotels with green certifications",
      impact: "Save 200L water per night",
      color: "text-blue-600"
    },
    {
      icon: Recycle,
      title: "Eco-Friendly Accommodations",
      description: "3 certified green hotels available",
      impact: "30% less waste generation",
      color: "text-emerald-600"
    }
  ];

  const sustainabilityScore = 78;
  const carbonSaved = 42;
  const ecoRanking = "Green Traveler";

  return (
    <section id="sustainability" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-eco-green/10 rounded-full px-4 py-2 mb-4">
            <Leaf className="w-4 h-4 text-eco-green" />
            <span className="text-sm font-medium text-eco-green">Sustainability Insights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Travel Responsibly, Impact Positively
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover eco-friendly options and track your environmental impact with personalized sustainability recommendations.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Sustainability Score Card */}
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-eco-green" />
                <span>Your Sustainability Score</span>
              </CardTitle>
              <CardDescription>
                Based on your travel choices and environmental impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="w-24 h-24 bg-gradient-sustainability rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{sustainabilityScore}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Sustainability Score</h3>
                  <p className="text-sm text-muted-foreground">Out of 100</p>
                  <Progress value={sustainabilityScore} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-eco-green" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{carbonSaved}kg CO₂</h3>
                  <p className="text-sm text-muted-foreground">Carbon Saved</p>
                  <Badge variant="secondary" className="mt-2 bg-success/10 text-success">
                    This Month
                  </Badge>
                </div>

                <div className="text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{ecoRanking}</h3>
                  <p className="text-sm text-muted-foreground">Eco Ranking</p>
                  <Badge variant="secondary" className="mt-2 bg-eco-green/10 text-eco-green">
                    Level 3
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eco-Friendly Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ecoTips.map((tip, index) => (
              <Card key={index} className="shadow-card hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <tip.icon className={`w-6 h-6 ${tip.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{tip.title}</h3>
                      <p className="text-muted-foreground mb-3">{tip.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-eco-green/10 text-eco-green border-eco-green/20">
                          {tip.impact}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Environmental Impact Summary */}
          <Card className="shadow-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TreePine className="w-5 h-5 text-eco-green" />
                <span>Your Environmental Impact</span>
              </CardTitle>
              <CardDescription>
                Track your positive environmental contributions through sustainable travel choices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-eco-green/5 rounded-lg border border-eco-green/10">
                  <div className="text-2xl font-bold text-eco-green mb-1">156kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ Avoided</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">1,200L</div>
                  <div className="text-sm text-muted-foreground">Water Saved</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="text-2xl font-bold text-amber-600 mb-1">8</div>
                  <div className="text-sm text-muted-foreground">Trees Planted</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">24</div>
                  <div className="text-sm text-muted-foreground">Eco Hotels</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default SustainabilityInsights;