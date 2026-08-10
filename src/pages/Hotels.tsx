import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom"; // ✨ Imported useNavigate
import { Toaster, toast } from "react-hot-toast";
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
  Info,
  ShoppingBag,
  ShoppingCart, // Imported ShoppingCart icon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HotelDetails {
  id: string;
  name: string;
  address: string;
  rating: number;
  user_ratings_total: number;
  phone?: string;
  photoUrl?: string;
  price_level?: number | null;
}

// Interface for what we save to the Cart
interface CartItem extends HotelDetails {
  bookedPrice: string;
  bookedRooms: number;
  bookedGuests: number;
  checkIn: string;
  checkOut: string;
}

interface PredictedPrice {
  perNight: number;
  totalCost: number;
  season: string;
  priceRange: string;
  tip: string;
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const Hotels = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // ✨ Initialize the navigation hook
  const destination = searchParams.get("destination");

  // --- State ---
  const [hotels, setHotels] = useState<HotelDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predicted, setPredicted] = useState<Record<string, PredictedPrice>>(
    {},
  );
  const [predicting, setPredicting] = useState<Record<string, boolean>>({});

  // --- Search Parameters ---
  const today = new Date();
  const defaultIn = new Date(today.getTime() + 7 * 86400000);
  const defaultOut = new Date(today.getTime() + 9 * 86400000);

  const checkInParam = searchParams.get("checkIn");
  const checkOutParam = searchParams.get("checkOut");
  const isISO = (s: string | null) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const [checkInDate, setCheckInDate] = useState(
    isISO(checkInParam) ? (checkInParam as string) : toISODate(defaultIn),
  );
  const [checkOutDate, setCheckOutDate] = useState(
    isISO(checkOutParam) ? (checkOutParam as string) : toISODate(defaultOut),
  );
  const adultsParam = Number(searchParams.get("adults"));
  const roomsParam = Number(searchParams.get("rooms"));
  const [adults, setAdults] = useState(
    Number.isFinite(adultsParam) && adultsParam > 0 ? adultsParam : 2,
  );
  const [rooms, setRooms] = useState(
    Number.isFinite(roomsParam) && roomsParam > 0 ? roomsParam : 1,
  );

  // --- Fetch Data ---
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
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/get-hotels?destination=${encodeURIComponent(
            destination,
          )}`,
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
  }, [destination]);

  // --- Price Logic ---
  const getPriceDetails = (hotel: HotelDetails) => {
    let basePrice = 3500;
    if (hotel.price_level) {
      switch (hotel.price_level) {
        case 1:
          basePrice = 2000;
          break;
        case 2:
          basePrice = 4500;
          break;
        case 3:
          basePrice = 8000;
          break;
        case 4:
          basePrice = 15000;
          break;
        default:
          basePrice = 3500;
      }
    } else if (hotel.rating) {
      basePrice = hotel.rating > 4.3 ? 7000 : hotel.rating > 3.8 ? 4000 : 2500;
    }
    const randomFactor = Math.floor(Math.random() * 500 - 250);
    const finalPrice = Math.max(1500, (basePrice + randomFactor) * rooms);

    return {
      price: finalPrice.toLocaleString("en-IN"),
      currency: "INR",
      label: "Estimated Price / Night",
    };
  };

  const createBookingLink = (hotelName: string) => {
    return `https://www.google.com/search?q=${encodeURIComponent(
      hotelName + " " + destination + " booking",
    )}`;
  };

  // --- Handle Add to Cart ---
  const handleAddToCart = (hotel: HotelDetails) => {
    const priceInfo = getPriceDetails(hotel);

    // Create the item object
    const newItem: CartItem = {
      ...hotel,
      bookedPrice: priceInfo.price,
      bookedRooms: rooms,
      bookedGuests: adults,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    };

    // Save to LocalStorage
    const existingCart = JSON.parse(localStorage.getItem("tripCart") || "[]");
    localStorage.setItem(
      "tripCart",
      JSON.stringify([...existingCart, newItem]),
    );

    toast.success(
      `${hotel.name} added to cart! Redirecting to Route Planner...`,
    );

    // ✨ Redirect to Route Planner after 1.5 seconds so user sees the message
    setTimeout(() => {
      // We use window.location.href to ensure it forces a scroll to the hash on the main page
      window.location.href = "/#routes";
    }, 1500);
  };

  const handleGetPriceEstimate = async (hotel: HotelDetails) => {
    try {
      setPredicting((prev) => ({ ...prev, [hotel.id]: true }));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/predict-hotel-cost`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            members: adults,
            budgetType:
              hotel.price_level && hotel.price_level >= 3
                ? "luxury"
                : hotel.price_level === 1
                  ? "budget"
                  : "mid",
          }),
        },
      );

      const payload = (await response.json()) as PredictedPrice;
      setPredicted((prev) => ({ ...prev, [hotel.id]: payload }));
    } catch (predictErr) {
      console.error("Prediction failed", predictErr);
      toast.error("Unable to fetch seasonal estimate");
    } finally {
      setPredicting((prev) => ({ ...prev, [hotel.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-10">
      <Toaster position="top-center" reverseOrder={false} />

      <div className="container mx-auto px-4 py-8">
        {/* --- Header Section with Cart Button --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Button
              asChild
              variant="ghost"
              className="pl-0 hover-pl-2 transition-all"
            >
              <Link to="/#locgenie">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Destination Finder
              </Link>
            </Button>
            <h1 className="text-3xl font-bold mt-2">
              Hotels in <span className="text-primary">{destination}</span>
            </h1>
          </div>

          {/* Cart Button */}
          <Button
            asChild
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
          >
            <Link to="/cart">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Cart
            </Link>
          </Button>
        </div>

        {/* Controls Section */}
        <Card className="mb-8 shadow-sm border-primary/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Check In
                </label>
                <div className="flex items-center border rounded-md px-2 bg-background">
                  <Calendar className="w-4 h-4 text-primary mr-2" />
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full p-2 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Check Out
                </label>
                <div className="flex items-center border rounded-md px-2 bg-background">
                  <Calendar className="w-4 h-4 text-primary mr-2" />
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full p-2 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Adults
                </label>
                <div className="flex items-center border rounded-md px-2 bg-background">
                  <Users className="w-4 h-4 text-primary mr-2" />
                  <input
                    type="number"
                    min={1}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full p-2 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">
                  Rooms
                </label>
                <div className="flex items-center border rounded-md px-2 bg-background">
                  <BedDouble className="w-4 h-4 text-primary mr-2" />
                  <input
                    type="number"
                    min={1}
                    value={rooms}
                    onChange={(e) => setRooms(Number(e.target.value))}
                    className="w-full p-2 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => { }}
                  disabled={true}
                  className="w-full"
                  variant="outline"
                >
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
            <p className="text-muted-foreground">
              Finding hotels in {destination}...
            </p>
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
              const priceDetails = getPriceDetails(hotel);
              const estimate = predicted[hotel.id];

              return (
                <Card
                  key={hotel.id}
                  className="overflow-hidden shadow-md hover:shadow-xl transition-all flex flex-col group"
                >
                  <div className="h-48 overflow-hidden bg-muted relative">
                    {hotel.photoUrl ? (
                      <img
                        src={hotel.photoUrl}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
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
                    <CardTitle className="text-lg truncate" title={hotel.name}>
                      {hotel.name}
                    </CardTitle>
                    <CardDescription className="flex items-start gap-1 text-xs mt-1 h-10 line-clamp-2">
                      <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                      {hotel.address}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-grow flex flex-col justify-end pt-0">
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
                        {priceDetails.currency === "INR" && (
                          <IndianRupee className="w-5 h-5" />
                        )}
                        {priceDetails.price}
                        <span className="text-sm font-normal text-muted-foreground ml-1 self-end mb-1">
                          {priceDetails.currency}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Per Night ({rooms} {rooms > 1 ? "Rooms" : "Room"},{" "}
                        {adults} {adults > 1 ? "Guests" : "Guest"})
                      </p>
                      {estimate && (
                        <div className="mt-2 rounded border border-primary/20 bg-primary/5 p-2">
                          <p className="text-xs font-semibold text-primary">
                            Predicted:{" "}
                            {estimate.totalCost.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Per night:{" "}
                            {estimate.perNight.toLocaleString("en-IN", {
                              style: "currency",
                              currency: "INR",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Range: {estimate.priceRange}
                          </p>
                          <p className="text-xs mt-1">
                            Seasonal badge:{" "}
                            <span className="font-semibold">
                              {estimate.season}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => handleGetPriceEstimate(hotel)}
                        disabled={!!predicting[hotel.id]}
                      >
                        {predicting[hotel.id]
                          ? "Estimating..."
                          : "Get Price Estimate"}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAddToCart(hotel)}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>

                      <Button asChild className="flex-1">
                        <a
                          href={createBookingLink(hotel.name)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Book Now
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;
