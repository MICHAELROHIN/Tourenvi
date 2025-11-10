// src/pages/Hotels.tsx

import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Hotel,
  Star,
  Phone,
  MapPin,
  ChevronLeft,
  ImageOff,
} from "lucide-react";

// This interface must match the one in DestinationChooser
interface HotelDetails {
  id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  phone?: string; // Optional phone number
  photoUrl?: string; // Optional photo URL
}

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const destination = searchParams.get("destination");

  const [hotels, setHotels] = useState<HotelDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) {
      setError("No destination specified.");
      setIsLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8000/get-hotels?destination=${encodeURIComponent(
            destination
          )}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch hotel data.");
        }
        const data = await response.json();
        setHotels(data.hotels);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, [destination]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">
            Searching for hotels in {destination}...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-lg text-destructive">{error}</p>
        </div>
      );
    }

    if (hotels.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-lg text-muted-foreground">
            No hotels found for {destination}.
          </p>
        </div>
      );
    }

    // --- Hotel Card Grid ---
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden shadow-card">
            {hotel.photoUrl ? (
              <img
                src={hotel.photoUrl}
                alt={`Photo of ${hotel.name}`}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-muted/50 flex items-center justify-center">
                <ImageOff className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <CardHeader>
              <CardTitle>{hotel.name}</CardTitle>
              {hotel.rating && (
                <div className="flex items-center space-x-1 pt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-foreground">
                    {hotel.rating}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({hotel.user_ratings_total} ratings)
                  </span>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {hotel.address}
                </p>
              </div>
              {hotel.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {hotel.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link to="/#locgenie">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Destinations
            </Link>
          </Button>
        </div>
        <div className="flex items-center space-x-3 mb-8">
          <Hotel className="w-8 h-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Hotels in {destination}
          </h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Hotels;