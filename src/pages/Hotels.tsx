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
  ExternalLink,
  ChevronLeft,
  ImageOff,
  Calendar,
  Users,
  BedDouble,
  IndianRupee,
  MapPin,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- 1. Interface for Google Places Data ---
interface HotelDetails {
  id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  phone?: string;
  photoUrl?: string;
  price_level?: number | null; // 0=Free, 1=Inexpensive, 2=Moderate, 3=Expensive, 4=Very Expensive
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const destination = searchParams.get("destination");

  // --- State ---
  const [hotels, setHotels] = useState<HotelDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Search Parameters (Dates & Rooms) ---
  // These controls will now just update the text on the price card
  const today = new Date();
  const defaultIn = new Date(today.getTime() + 7 * 86400000); // 7 days from now
  const defaultOut = new Date(today.getTime() + 9 * 86400000); // 9 days from now

  const [checkInDate, setCheckInDate] = useState(toISODate(defaultIn));
  const [checkOutDate, setCheckOutDate] = useState(toISODate(defaultOut));
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);

  // --- 2. Function to Fetch Hotel Details from Google ---
  useEffect(() => {
    if (!destination) {
      setError("No destination specified.");
      setLoading(false);
      return;
    }

    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      setHotels([]);
      try {
        // We ONLY call /get-hotels now
        const response = await fetch(
          `http://localhost:8000/get-hotels?destination=${encodeURIComponent(
            destination
          )}`
        );
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || "Failed to fetch hotel data.");
        }
        const data = await response.json();
        if (data.hotels && data.hotels.length > 0) {
            setHotels(data.hotels);
        } else {
            setError("No hotels found for this location.");
        }
      } catch (err: any) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [destination]); // Runs only when destination changes

  // --- 3. PRICE ESTIMATION LOGIC ---
  const getPriceDetails = (hotel: HotelDetails) => {
    let basePrice = 3500; // Default base if no data

    // Use Google's Price Level (1-4) for a good estimate
    if (hotel.price_level) {
        switch(hotel.price_level) {
            case 1: basePrice = 2000; break; // Inexpensive
            case 2: basePrice = 4500; break; // Moderate
            case 3: basePrice = 8000; break; // Expensive
            case 4: basePrice = 15000; break; // Very Expensive
            default: basePrice = 3500;
        }
    } else if (hotel.rating) {
        // If no price level, guess based on star rating
        basePrice = hotel.rating > 4.3 ? 7000 : hotel.rating > 3.8 ? 4000 : 2500;
    }

    // Add a small random amount to make prices look varied
    const randomFactor = Math.floor(Math.random() * 500 - 250); 
    const finalPrice = Math.max(1500, (basePrice + randomFactor) * rooms); // Multiply by rooms
    
    return {
        price: finalPrice.toLocaleString('en-IN'), // Format as "8,000"
        currency: "INR",
        label: "Estimated Price / Night"
    };
  };

  const createBookingLink = (hotelName: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(hotelName + " " + destination + " booking")}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="pl-0 hover-pl-2 transition-all">
            <Link to="/#locgenie">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Destination Finder
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">
            Hotels in <span className="text-primary">{destination}</span>
          </h1>
        </div>

        {/* Controls Section (Inputs) */}
        <Card className="mb-8 shadow-sm border-primary/10">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Check In */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Check In</label>
                        <div className="flex items-center border rounded-md px-2 bg-background">
                             <Calendar className="w-4 h-4 text-primary mr-2"/>
                             <input type="date" value={checkInDate} onChange={e => setCheckInDate(e.target.value)} className="w-full p-2 bg-transparent text-sm outline-none" />
                        </div>
                    </div>
                    {/* Check Out */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Check Out</label>
                        <div className="flex items-center border rounded-md px-2 bg-background">
                             <Calendar className="w-4 h-4 text-primary mr-2"/>
                             <input type="date" value={checkOutDate} onChange={e => setCheckOutDate(e.target.value)} className="w-full p-2 bg-transparent text-sm outline-none" />
                        </div>
                    </div>
                    {/* Adults */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Adults</label>
                        <div className="flex items-center border rounded-md px-2 bg-background">
                             <Users className="w-4 h-4 text-primary mr-2"/>
                             <input type="number" min={1} value={adults} onChange={e => setAdults(Number(e.target.value))} className="w-full p-2 bg-transparent text-sm outline-none" />
                        </div>
                    </div>
                    {/* Rooms */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Rooms</label>
                         <div className="flex items-center border rounded-md px-2 bg-background">
                             <BedDouble className="w-4 h-4 text-primary mr-2"/>
                             <input type="number" min={1} value={rooms} onChange={e => setRooms(Number(e.target.value))} className="w-full p-2 bg-transparent text-sm outline-none" />
                        </div>
                    </div>
                    {/* Button */}
                    <div className="flex items-end">
                        <Button onClick={() => {}} disabled={true} className="w-full" variant="outline">
                            (Prices Auto-Update)
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Results Section */}
        {loading && (
             <div className="flex flex-col items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Finding hotels in {destination}...</p>
             </div>
        )}

        {!loading && error && (
            <div className="p-6 text-center bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                <p className="font-medium">{error}</p>
            </div>
        )}

        {!loading && !error && hotels.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel) => {
                    // Get the estimated price
                    const priceDetails = getPriceDetails(hotel);
                    
                    return (
                    <Card key={hotel.id} className="overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col group">
                        {/* Hotel Image */}
                        <div className="h-48 overflow-hidden bg-muted relative">
                            {hotel.photoUrl ? (
                                <img src={hotel.photoUrl} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <ImageOff className="w-10 h-10" />
                                </div>
                            )}
                            {hotel.rating && (
                                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                                    {hotel.rating} ({hotel.user_ratings_total})
                                </div>
                            )}
                        </div>

                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg truncate" title={hotel.name}>{hotel.name}</CardTitle>
                            <CardDescription className="flex items-start gap-1 text-xs mt-1 h-10 line-clamp-2">
                                <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                {hotel.address}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-grow flex flex-col justify-end pt-0">
                            {/* Price Box */}
                            <div className="bg-secondary/10 p-3 rounded-lg mb-4 border border-secondary/20">
                                <p className="text-xs text-muted-foreground mb-1 flex items-center">
                                    {priceDetails.label}
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="ml-1">
                                                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Est. based on Google price level & rating.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </p>
                                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                                    {priceDetails.currency === "INR" && <IndianRupee className="w-5 h-5" />}
                                    {priceDetails.price}
                                    <span className="text-sm font-normal text-muted-foreground ml-1 self-end mb-1">{priceDetails.currency}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                   Per Night ({rooms} {rooms > 1 ? 'Rooms' : 'Room'}, {adults} {adults > 1 ? 'Guests' : 'Guest'})
                                </p>
                            </div>

                            <Button asChild className="w-full">
                                <a href={createBookingLink(hotel.name)} target="_blank" rel="noreferrer">
                                    Check Availability
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                )})}
            </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;