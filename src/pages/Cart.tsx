import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  ChevronLeft,
  Trash2,
  Calendar,
  Users,
  BedDouble,
  IndianRupee,
  MapPin,
  ShoppingBag,
  CreditCard
} from "lucide-react";

// Matches the structure saved in Hotels.tsx
interface CartItem {
  id: string;
  name: string;
  address: string;
  rating: number;
  phone?: string;
  photoUrl?: string;
  bookedPrice: string; // Stored as string "3,500"
  bookedRooms: number;
  bookedGuests: number;
  checkIn: string;
  checkOut: string;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  // Load items from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("tripCart");
    if (savedCart) {
      const parsedCart: CartItem[] = JSON.parse(savedCart);
      setCartItems(parsedCart);
      calculateTotal(parsedCart);
    }
  }, []);

  const calculateTotal = (items: CartItem[]) => {
    const totalAmount = items.reduce((acc, item) => {
      // Remove commas from price string to convert to number
      const numericPrice = parseFloat(item.bookedPrice.replace(/,/g, ""));
      return acc + (isNaN(numericPrice) ? 0 : numericPrice);
    }, 0);
    setTotal(totalAmount);
  };

  const removeItem = (indexToRemove: number) => {
    const updatedCart = cartItems.filter((_, index) => index !== indexToRemove);
    setCartItems(updatedCart);
    localStorage.setItem("tripCart", JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
    toast.success("Item removed from cart");
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout...", { icon: "💳" });
    // Add real checkout logic here later
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Toaster position="top-center" />

      <div className="container mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="pl-0 hover-pl-2 transition-all mb-4">
            <Link to="/hotels?destination=Ooty"> {/* You might want to make this dynamic or go back to history */}
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Hotels
            </Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-primary" />
            Your Trip Cart
          </h1>
          <p className="text-muted-foreground mt-2">
            Review your selected stays before finalizing your booking.
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-muted-foreground mb-4">Looks like you haven't added any hotels yet.</p>
                <Button asChild>
                  <Link to="/">Browse Destinations</Link>
                </Button>
              </div>
            ) : (
              cartItems.map((item, index) => (
                <Card key={`${item.id}-${index}`} className="flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image Section */}
                  <div className="w-full md:w-48 h-48 md:h-auto bg-muted relative shrink-0">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                    )}
                  </div>

                  {/* Details Section */}
                  <CardContent className="flex-grow p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-primary">{item.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" /> {item.address}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive -mt-2 -mr-2"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Booking Details Grid */}
                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>In: {item.checkIn}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span>Out: {item.checkOut}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded">
                          <Users className="w-4 h-4 text-primary" />
                          <span>{item.bookedGuests} Guests</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground bg-secondary/20 p-2 rounded">
                          <BedDouble className="w-4 h-4 text-primary" />
                          <span>{item.bookedRooms} Room(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-between items-end">
                      <span className="text-sm text-muted-foreground">Price per night</span>
                      <div className="text-xl font-bold flex items-center text-primary">
                        <IndianRupee className="w-5 h-5" />
                        {item.bookedPrice}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 shadow-lg border-primary/10">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle>Cart Summary</CardTitle>
                <CardDescription>Total estimated cost for your trip.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Items in cart</span>
                  <span className="font-medium">{cartItems.length}</span>
                </div>

                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold">Total</span>
                  <span className="text-2xl font-bold text-primary flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    {total.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  className="w-full text-lg py-6 mt-4"
                  disabled={cartItems.length === 0}
                  onClick={handleCheckout}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-2">
                  Taxes and fees calculated at checkout.
                </p>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Cart;