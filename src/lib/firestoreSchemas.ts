import { Timestamp } from "firebase/firestore";

/**
 * Tourenvi Firestore Database Schemas
 * These TypeScript interfaces represent the data models stored in Firestore.
 */

// Represents a generated Trip Plan/Itinerary
export interface Trip {
  id?: string;                     // Firestore Document ID
  userId: string;                  // User who created the trip
  userEmail: string;               // Email for sending reminders
  destination: string;             // e.g., "Paris, France"
  startDate: Timestamp;            // When the trip starts
  endDate: Timestamp;              // When the trip ends
  totalBudgetCap: number;          // User-defined budget cap
  createdAt: Timestamp;            // Creation timestamp
  
  // Navigation & Tracking specific fields
  vehicleLicensePlate?: string;    // Captured when user starts active navigation
  isTrackingActive?: boolean;      // Status flag for live navigation mode
  
  // Storing the Directions API route points for offline/sync access
  encodedPath?: string;            // Encoded polyline string of the route
  waypoints?: Waypoint[];          // Array of stops, including smart recommendations
}

// Represents a point of interest or stop along the route
export interface Waypoint {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  type: "destination" | "attraction" | "hotel" | "ev_charging" | "fuel_station" | "danger_zone";
  description?: string;
  isSmartRecommendation?: boolean; // Flag for auto-injected optimal stops
}

// Represents a real-time danger zone / risk overlay marker
export interface RiskOverlay {
  id?: string;
  type: "flooding" | "accident" | "weather" | "construction";
  severity: "low" | "medium" | "high" | "critical";
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  reportedAt: Timestamp;
  active: boolean;
}

// Represents live telemetry tracking data (can be updated frequently during transit)
export interface TrackingUpdate {
  id?: string;
  tripId: string;                  // Reference to the active trip
  userId: string;                  // Driver/User ID
  vehicleLicensePlate: string;     // Active vehicle
  currentLocation: {
    lat: number;
    lng: number;
  };
  heading: number;                 // Direction in degrees (0-360) for navigation arrow
  speed?: number;                  // Current speed in km/h or mph
  timestamp: Timestamp;            // When this update was recorded
}
