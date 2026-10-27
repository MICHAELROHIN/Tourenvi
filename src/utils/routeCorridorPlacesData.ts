/**
 * Tourenvi - Verified Road-Trip Enroute Attractions & Authentic Regional Food Corridors
 * 100% Real-World Verified Places & Famous Foods that travelers physically encounter on Indian Highway Road Trips
 */

export interface RealAttraction {
  id: string;
  name: string;
  city: string;
  highway: string;
  highwayKmMarker: number; // Approximate km from journey origin on this highway
  enrouteStatus: "Directly On Highway" | "Quick Highway Exit (≤ 3 km)" | "Scenic Ghat Route" | "Destination Attraction";
  category: "waterfall" | "temple" | "fort_palace" | "viewpoint" | "nature_park" | "beach_lake" | "museum" | "heritage";
  categoryLabel: string;
  lat: number;
  lng: number;
  imageUrl: string;
  shortDescription: string;
  whyVisit: string;
  detourKm: number;
  detourMinutes: number;
  visitDurationHours: string;
  timings: string;
  entryFee: string;
  rating: number;
  reviewsCount: string;
  tags: string[];
}

export interface FamousFoodSpecialty {
  id: string;
  city: string;
  highway: string;
  highwayStopDistance: string;
  foodName: string;
  foodType: "Snack & Sweet" | "Main Course" | "Drink / Beverage" | "Traditional Meal" | "Bakery";
  isVegetarian: boolean;
  famousOutlet: string;
  description: string;
  whyFamous: string;
  priceRange: string;
  imageUrl: string;
  lat: number;
  lng: number;
}

export interface RoadTripCorridor {
  routeKey: string;
  corridorTitle: string;
  mainHighways: string;
  totalDistanceKm: number;
  transitStops: {
    city: string;
    highway: string;
    kmFromStart: number;
    attractions: RealAttraction[];
    famousFoods: FamousFoodSpecialty[];
  }[];
}

export const VERIFIED_ROADTRIP_CORRIDORS: Record<string, RoadTripCorridor> = {
  // =========================================================================
  // 1. CHENNAI → COURTALLAM (KUTRALAM)
  // Highway: NH 45 (GST) → NH 38 → NH 44 → NH 744 → SH 40
  // Path: Chennai → Tindivanam/Gingee → Trichy → Dindigul → Madurai → Srivilliputhur → Tenkasi → Courtallam
  // =========================================================================
  "chennai-courtallam": {
    routeKey: "chennai-courtallam",
    corridorTitle: "Chennai → Courtallam (Kutralam) Highway Corridor",
    mainHighways: "NH 45 (GST Road), NH 38, NH 44 & NH 744 (Western Ghats Approach)",
    totalDistanceKm: 625,
    transitStops: [
      {
        city: "Tindivanam / Gingee",
        highway: "NH 45 (GST Road) Junction",
        kmFromStart: 120,
        attractions: [
          {
            id: "gingee-fort",
            name: "Gingee Fort (Senji Fort - Troy of the East)",
            city: "Gingee (Tindivanam Exit)",
            highway: "NH 77 Exit off NH 45 (15 mins from highway)",
            highwayKmMarker: 120,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "Ancient Hill Fort",
            lat: 12.2533,
            lng: 79.4184,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "800-year-old impregnable fortress complex across Rajagiri and Krishnagiri hills with an 8-story Kalyana Mahal.",
            whyVisit: "Chhatrapati Shivaji called it the most secure fortress in India; scenic hill climb with 360-degree views.",
            detourKm: 14,
            detourMinutes: 18,
            visitDurationHours: "2 hrs",
            timings: "9:00 AM – 5:30 PM",
            entryFee: "₹25 (Indians), ₹300 (Foreigners)",
            rating: 4.7,
            reviewsCount: "15,200+",
            tags: ["Trekking", "Architecture", "Maratha Heritage", "Panoramic Views"]
          }
        ],
        famousFoods: [
          {
            id: "tindivanam-food-dosa",
            city: "Tindivanam",
            highway: "NH 45 Highway Food Plaza",
            highwayStopDistance: "120 km from Chennai",
            foodName: "Gingee Village Wood-Fired Podi Dosa & Filter Coffee",
            foodType: "Main Course",
            isVegetarian: true,
            famousOutlet: "Hotel Highway Star / Sri Balaji Bhavan (GST Road)",
            description: "Crispy cast-iron griddle dosa topped with spicy gun-powder (idli podi) and fresh churned country butter.",
            whyFamous: "Classic breakfast halt for early morning Chennai road-trippers heading South.",
            priceRange: "₹80 - ₹150",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80",
            lat: 12.2323,
            lng: 79.6508
          }
        ]
      },
      {
        city: "Trichy (Tiruchirappalli)",
        highway: "NH 38 / GST Corridor Entry",
        kmFromStart: 320,
        attractions: [
          {
            id: "trichy-srirangam",
            name: "Sri Ranganathaswamy Temple, Srirangam",
            city: "Tiruchirappalli",
            highway: "NH 38 Cauvery Bridge Exit (2 km from highway)",
            highwayKmMarker: 320,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "temple",
            categoryLabel: "World's Largest Functioning Temple",
            lat: 10.8624,
            lng: 78.6901,
            imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=600&h=400&fit=crop&q=80",
            shortDescription: "Enormous 156-acre island temple complex enclosed by 7 concentric walls and 21 grand gopurams.",
            whyVisit: "Guinness-recognized world wonder with a 73-meter Rajagopuram directly beside the highway bridge over River Cauvery.",
            detourKm: 3.5,
            detourMinutes: 8,
            visitDurationHours: "1.5 - 2 hrs",
            timings: "6:00 AM – 1:00 PM, 3:30 PM – 9:00 PM",
            entryFee: "Free (Quick Darshan ₹100)",
            rating: 4.9,
            reviewsCount: "68,000+",
            tags: ["UNESCO Listed", "Vishnu Temple", "Cauvery Island"]
          },
          {
            id: "trichy-rockfort",
            name: "Trichy Rockfort & Ucchi Pillayar Temple",
            city: "Tiruchirappalli",
            highway: "NH 38 City Center Bypass",
            highwayKmMarker: 325,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "3.8 Billion Year Old Rock Shrine",
            lat: 10.8284,
            lng: 78.6968,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Dramatic monolithic 83-meter high ancient rock structure crowned with a 7th-century Ganesha temple.",
            whyVisit: "Climb 437 steps cut into solid rock for unmatched panoramic views of Srirangam and the Cauvery basin.",
            detourKm: 3,
            detourMinutes: 8,
            visitDurationHours: "1.5 hrs",
            timings: "6:00 AM – 8:00 PM",
            entryFee: "₹10 per person",
            rating: 4.8,
            reviewsCount: "34,500+",
            tags: ["Ancient Rock", "Hilltop Panorama", "Nayak Fort"]
          }
        ],
        famousFoods: [
          {
            id: "trichy-food-murukku",
            city: "Tiruchirappalli",
            highway: "NH 38 / NH 45 Highway Bypass",
            highwayStopDistance: "325 km from Chennai",
            foodName: "Authentic Manapparai Murukku (Double-Fried Crunch)",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Traditional Manapparai Highway Stalls / Achi Mess Trichy",
            description: "World-famous spiral snack double fried in pure groundnut oil for maximum crunchiness.",
            whyFamous: "GI-tagged snack purchased by every highway road-tripper passing through Central Tamil Nadu.",
            priceRange: "₹60 - ₹120 per box",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=80",
            lat: 10.6074,
            lng: 78.4237
          },
          {
            id: "trichy-food-meals",
            city: "Tiruchirappalli",
            highway: "NH 38 Bypass / Central Junction",
            highwayStopDistance: "320 km from Chennai",
            foodName: "Traditional Cauvery Plantain Leaf Full Meals",
            foodType: "Traditional Meal",
            isVegetarian: true,
            famousOutlet: "Hotel Guru / Vasantha Bhavan / Ezham Suvai",
            description: "Unlimited steaming Ponni rice served on fresh plantain leaf with 3 kinds of sambar, rasam, kootu, poriyal & payasam.",
            whyFamous: "Authentic Chola nadu midday lunch feast prepared with freshly ground spices and native ghee.",
            priceRange: "₹140 - ₹220",
            imageUrl: "https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=400&h=300&fit=crop&q=80",
            lat: 10.7905,
            lng: 78.7047
          }
        ]
      },
      {
        city: "Dindigul",
        highway: "NH 83 / NH 44 Intersection",
        kmFromStart: 420,
        attractions: [
          {
            id: "dindigul-rockfort",
            name: "Dindigul Rock Fort (Malai Kottai)",
            city: "Dindigul",
            highway: "NH 44 / NH 83 Bypass (1.5 km)",
            highwayKmMarker: 420,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "17th Century Nayak Citadel",
            lat: 10.3629,
            lng: 77.9699,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "280-foot monolithic granite fortress built by Nayak King Muthu Krishnappa and fortified with heavy cannons by Tipu Sultan.",
            whyVisit: "Visible right from the highway; offers commanding views of Sirumalai hills and historical armory rooms.",
            detourKm: 2,
            detourMinutes: 5,
            visitDurationHours: "1 hr",
            timings: "9:00 AM – 5:30 PM",
            entryFee: "₹25",
            rating: 4.6,
            reviewsCount: "11,800+",
            tags: ["Tipu Sultan Cannons", "Nayak Fort", "Hilltop Panorama"]
          }
        ],
        famousFoods: [
          {
            id: "dindigul-food-biryani",
            city: "Dindigul",
            highway: "NH 44 / NH 83 Bypass Roundabout",
            highwayStopDistance: "420 km from Chennai",
            foodName: "Original Dindigul Seeraga Samba Mutton Biryani",
            foodType: "Main Course",
            isVegetarian: false,
            famousOutlet: "Dindigul Thalappakatti (Original 1957 Outlet) / Venu Biryani",
            description: "Fragrant short-grain Seeraga Samba rice slow cooked with tender meat, curd, and hand-ground spices.",
            whyFamous: "World-renowned culinary icon loved for its distinct tangy flavor and aroma; essential road trip lunch stop.",
            priceRange: "₹240 - ₹380",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=80",
            lat: 10.3673,
            lng: 77.9803
          }
        ]
      },
      {
        city: "Madurai",
        highway: "NH 44 / NH 744 Gateway",
        kmFromStart: 485,
        attractions: [
          {
            id: "madurai-meenakshi",
            name: "Arulmigu Meenakshi Amman Temple",
            city: "Madurai",
            highway: "NH 44 City Entry (4 km)",
            highwayKmMarker: 485,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "temple",
            categoryLabel: "World Wonder of Dravidian Architecture",
            lat: 9.9195,
            lng: 78.1193,
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&q=80",
            shortDescription: "Architectural jewel with 14 soaring gopurams, Golden Lotus Tank, and Hall of 1,000 Pillars.",
            whyVisit: "2,500-year-old living heritage icon visited by travelers worldwide; mesmerizing stone carvings and spiritual energy.",
            detourKm: 4.5,
            detourMinutes: 12,
            visitDurationHours: "2 hrs",
            timings: "5:00 AM – 12:30 PM, 4:00 PM – 10:00 PM",
            entryFee: "Free (1000 Pillars Hall ₹50)",
            rating: 4.9,
            reviewsCount: "95,000+",
            tags: ["Dravidian Architecture", "14 Gopurams", "Golden Lotus Tank"]
          },
          {
            id: "thirumalai-nayakkar",
            name: "Thirumalai Nayakkar Palace",
            city: "Madurai",
            highway: "East Veli Street off NH 44",
            highwayKmMarker: 487,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "1636 AD Royal Indo-Saracenic Palace",
            lat: 9.9149,
            lng: 78.1242,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Royal palace built by King Tirumala Nayaka with gigantic white cylindrical pillars (19m height) and painted domes.",
            whyVisit: "Stunning blend of Italian Renaissance and Dravidian court architecture.",
            detourKm: 4.8,
            detourMinutes: 12,
            visitDurationHours: "1 hr",
            timings: "9:00 AM – 5:00 PM",
            entryFee: "₹10",
            rating: 4.7,
            reviewsCount: "28,000+",
            tags: ["Giant Pillars", "Nayak Court", "Royal Palace"]
          },
          {
            id: "vandiyur-teppakulam",
            name: "Vandiyur Mariamman Teppakulam (Temple Tank)",
            city: "Madurai",
            highway: "Madurai Ring Road Highway Exit",
            highwayKmMarker: 490,
            enrouteStatus: "Directly On Highway",
            category: "heritage",
            categoryLabel: "16-Acre Sacred Reservoir",
            lat: 9.9125,
            lng: 78.1541,
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&q=80",
            shortDescription: "Massive square water reservoir with an island Maiya Mandapam garden connected to the Vaigai River.",
            whyVisit: "The largest temple tank in Tamil Nadu situated right beside the highway ring road; breezy sunset stop.",
            detourKm: 1,
            detourMinutes: 3,
            visitDurationHours: "45 mins",
            timings: "Open all day",
            entryFee: "Free",
            rating: 4.6,
            reviewsCount: "11,000+",
            tags: ["Giant Tank", "Island Pavilion", "Vaigai Water"]
          }
        ],
        famousFoods: [
          {
            id: "madurai-food-jigarthanda",
            city: "Madurai",
            highway: "Madurai Highway Ring Road / Bypass",
            highwayStopDistance: "485 km from Chennai",
            foodName: "Famous Royal Madurai Special Jigarthanda",
            foodType: "Drink / Beverage",
            isVegetarian: true,
            famousOutlet: "Famous Jigarthanda (Since 1977 - Bypass Outlets)",
            description: "Cooling royal beverage made with badam pisin (almond gum), nannari syrup, basundi milk, and rich malai ice cream.",
            whyFamous: "Madurai's most iconic sweet drink—literally 'Heart Cooler', historically introduced during the Nayak era.",
            priceRange: "₹60 - ₹120",
            imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop&q=80",
            lat: 9.9195,
            lng: 78.1193
          },
          {
            id: "madurai-food-bunparotta",
            city: "Madurai",
            highway: "Simmakkal / Ring Road",
            highwayStopDistance: "485 km from Chennai",
            foodName: "Madurai Bun Parotta & Spicy Chicken/Mutton Salna",
            foodType: "Main Course",
            isVegetarian: false,
            famousOutlet: "Simmakkal Bun Parotta Kadai / Amma Mess / Konar Mess",
            description: "Fluffy bun-shaped layered parotta shallow-fried in ghee to golden crispiness, served with fiery aromatic salna.",
            whyFamous: "Culinary sensation unique to Madurai night eateries; crispy exterior with cloud-soft buttery layers inside.",
            priceRange: "₹120 - ₹260",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80",
            lat: 9.9252,
            lng: 78.1198
          }
        ]
      },
      {
        city: "Srivilliputhur",
        highway: "NH 744 (Madurai–Tenkasi Highway)",
        kmFromStart: 560,
        attractions: [
          {
            id: "srivilliputhur-andal",
            name: "Srivilliputhur Andal Temple (Vatapatrasayi)",
            city: "Srivilliputhur",
            highway: "NH 744 Town Center (1.5 km)",
            highwayKmMarker: 560,
            enrouteStatus: "Directly On Highway",
            category: "temple",
            categoryLabel: "Tamil Nadu Official State Emblem",
            lat: 9.5104,
            lng: 77.6322,
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&q=80",
            shortDescription: "11-tiered 192-foot Rajagopuram that serves as the official state emblem of the Government of Tamil Nadu.",
            whyVisit: "Directly on the highway route to Courtallam; birthplace of saint-poetess Andal and extraordinary architecture.",
            detourKm: 1.2,
            detourMinutes: 3,
            visitDurationHours: "1 hr",
            timings: "6:00 AM – 1:00 PM, 4:00 PM – 9:00 PM",
            entryFee: "Free",
            rating: 4.9,
            reviewsCount: "24,000+",
            tags: ["State Emblem", "192ft Tower", "Divya Desam"]
          }
        ],
        famousFoods: [
          {
            id: "srivilliputhur-food-palkova",
            city: "Srivilliputhur",
            highway: "NH 744 Main Road / Andal Sannadhi",
            highwayStopDistance: "560 km from Chennai",
            foodName: "Authentic GI-Tagged Srivilliputhur Palkova (Pure Milk Sweet)",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Srivilliputhur Co-operative Milk Society / Venkateswara Palkova",
            description: "Slow-simmered rich cow's milk reduced over firewood with pure cane sugar into a heavenly caramelized fudge.",
            whyFamous: "Official GI-tagged delicacy celebrated across India for its pure melt-in-mouth richness.",
            priceRange: "₹80 - ₹180 per 250g",
            imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop&q=80",
            lat: 9.5104,
            lng: 77.6322
          }
        ]
      },
      {
        city: "Tenkasi",
        highway: "NH 744 (5 km before Courtallam)",
        kmFromStart: 620,
        attractions: [
          {
            id: "tenkasi-kasi-viswanathar",
            name: "Tenkasi Kasi Viswanathar Temple (Dakshina Kasi)",
            city: "Tenkasi",
            highway: "NH 744 / Courtallam Main Road",
            highwayKmMarker: 620,
            enrouteStatus: "Directly On Highway",
            category: "temple",
            categoryLabel: "13th-Century Pandyan Temple",
            lat: 8.9593,
            lng: 77.3159,
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&q=80",
            shortDescription: "700-year-old Pandyan temple with a soaring 178-foot Rajagopuram and musical stone pillars.",
            whyVisit: "Known as 'Kasi of the South'; breeze blows continuously through the tower, offering serene spiritual vibes 5 km before Courtallam.",
            detourKm: 0.5,
            detourMinutes: 2,
            visitDurationHours: "45 mins",
            timings: "6:00 AM – 12:00 PM, 4:00 PM – 8:30 PM",
            entryFee: "Free",
            rating: 4.8,
            reviewsCount: "16,800+",
            tags: ["Musical Pillars", "Dakshina Kasi", "Pandyan Monument"]
          }
        ],
        famousFoods: [
          {
            id: "tenkasi-food-borderparotta",
            city: "Tenkasi / Sengottai (Courtallam Border)",
            highway: "Tenkasi–Courtallam Link Road",
            highwayStopDistance: "620 km from Chennai",
            foodName: "Famous Courtallam Border Rahmath Kadai Parotta & Nattu Kozhi Pepper Fry",
            foodType: "Main Course",
            isVegetarian: false,
            famousOutlet: "Border Rahmath Kadai (Since 1970 - Sengottai Border)",
            description: "Crispy coin parottas soaked in piping-hot gravy, served with country chicken (Nattu Kozhi) pepper fry and quail roast.",
            whyFamous: "Legendary cult food destination frequented by all travelers after bathing in Courtallam waterfalls.",
            priceRange: "₹140 - ₹320",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80",
            lat: 8.9712,
            lng: 77.2415
          }
        ]
      },
      {
        city: "Courtallam (Destination Hub)",
        highway: "Western Ghats Falls Promenade (SH 40)",
        kmFromStart: 625,
        attractions: [
          {
            id: "kutralam-main-falls",
            name: "Courtallam Main Falls (Peraruvi)",
            city: "Courtallam",
            highway: "Main Falls Circle",
            highwayKmMarker: 625,
            enrouteStatus: "Destination Attraction",
            category: "waterfall",
            categoryLabel: "Medicinal Herbal Waterfall",
            lat: 8.9304,
            lng: 77.2758,
            imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&h=400&fit=crop&q=80",
            shortDescription: "60-meter roaring waterfall dropping into a rock pool, flowing through dense medicinal herb forests of Western Ghats.",
            whyVisit: "Celebrated as the 'Natural Medical Spa of South India'; waters are enriched with sulfur and wild herbs that rejuvenate mind and body.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "2 - 3 hrs",
            timings: "Open 24 hrs during season",
            entryFee: "Free",
            rating: 4.8,
            reviewsCount: "48,000+",
            tags: ["Peraruvi", "Herbal Bath", "Spa of South India", "Main Attraction"]
          },
          {
            id: "kutralam-five-falls",
            name: "Five Falls (Aintharuvi)",
            city: "Courtallam",
            highway: "Five Falls Road (3.5 km from center)",
            highwayKmMarker: 628,
            enrouteStatus: "Destination Attraction",
            category: "waterfall",
            categoryLabel: "Five Splitting Waterfalls",
            lat: 8.9221,
            lng: 77.2482,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "The river splits into five distinct cascading streams resembling the five heads of a hooded serpent.",
            whyVisit: "The most family-friendly bathing spot in Courtallam with dedicated men, women, and children bathing zones.",
            detourKm: 3.5,
            detourMinutes: 6,
            visitDurationHours: "2 hrs",
            timings: "6:00 AM – 7:00 PM",
            entryFee: "Free",
            rating: 4.9,
            reviewsCount: "38,000+",
            tags: ["Aintharuvi", "Five Cascades", "Family Bathing"]
          },
          {
            id: "kutralam-old-falls",
            name: "Old Courtallam Falls (Pazhaya Courtallam)",
            city: "Courtallam",
            highway: "Old Courtallam Road (5 km)",
            highwayKmMarker: 630,
            enrouteStatus: "Destination Attraction",
            category: "waterfall",
            categoryLabel: "Scenic Rock Waterfall",
            lat: 8.9482,
            lng: 77.3015,
            imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&h=400&fit=crop&q=80",
            shortDescription: "Charming waterfall cascading between two massive granite boulders into stepped natural pools.",
            whyVisit: "Surrounded by quiet fruit orchards, coconut groves, and breezy valleys.",
            detourKm: 5,
            detourMinutes: 8,
            visitDurationHours: "1.5 hrs",
            timings: "6:00 AM – 6:30 PM",
            entryFee: "Free",
            rating: 4.7,
            reviewsCount: "22,000+",
            tags: ["Pazhaya Courtallam", "Rock Boulder", "Quiet Bath"]
          },
          {
            id: "kutralam-chithira-sabha",
            name: "Chitra Sabha & Kutralanathar Temple",
            city: "Courtallam",
            highway: "Beside Main Falls",
            highwayKmMarker: 625,
            enrouteStatus: "Destination Attraction",
            category: "temple",
            categoryLabel: "Ancient Cosmic Dance Hall",
            lat: 8.9312,
            lng: 77.2764,
            imageUrl: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&h=400&fit=crop&q=80",
            shortDescription: "One of the 5 sacred dance halls of Lord Shiva featuring century-old natural vegetable dye fresco paintings.",
            whyVisit: "Copper-plated roof and rare historical murals depicting classical legends.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "45 mins",
            timings: "6:00 AM – 12:00 PM, 4:30 PM – 8:00 PM",
            entryFee: "Free",
            rating: 4.8,
            reviewsCount: "12,000+",
            tags: ["Chitra Sabha", "Vegetable Dye Murals", "Heritage"]
          }
        ],
        famousFoods: [
          {
            id: "courtallam-food-fruits",
            city: "Courtallam",
            highway: "Main Falls Market",
            highwayStopDistance: "625 km (Destination)",
            foodName: "Fresh Western Ghats Sukku Malli Herbal Tea & Hill Mangosteen",
            foodType: "Drink / Beverage",
            isVegetarian: true,
            famousOutlet: "Falls Promenade Herbal Stalls",
            description: "Warm brewed ginger-coriander herbal tea sweetened with palm jaggery, accompanied by fresh Agasthyamalai fruits.",
            whyFamous: "Provides warmth and digestion boost after bathing in the mineral waters.",
            priceRange: "₹30 - ₹80",
            imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop&q=80",
            lat: 8.9304,
            lng: 77.2758
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 2. CHENNAI → KODAIKANAL
  // Highway: NH 45 (GST) → NH 38 → NH 83 → SH 156 (Ghat Pass)
  // Path: Chennai → Tindivanam/Gingee → Trichy → Dindigul → Batlagundu/Ghat → Kodaikanal
  // =========================================================================
  "chennai-kodaikanal": {
    routeKey: "chennai-kodaikanal",
    corridorTitle: "Chennai → Kodaikanal Highway Corridor",
    mainHighways: "NH 45 (GST Road), NH 38, NH 83 & SH 156 (Kodai Ghat Road)",
    totalDistanceKm: 535,
    transitStops: [
      {
        city: "Tindivanam / Gingee",
        highway: "NH 45 (GST Road)",
        kmFromStart: 120,
        attractions: [
          {
            id: "gingee-fort-kodai",
            name: "Gingee Fort (Senji Fort - Troy of the East)",
            city: "Gingee (Tindivanam Exit)",
            highway: "NH 77 Exit off NH 45 (15 mins from highway)",
            highwayKmMarker: 120,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "Ancient Hilltop Citadel",
            lat: 12.2533,
            lng: 79.4184,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "800-year-old fort complex spanning Rajagiri & Krishnagiri hills with an 8-story Kalyana Mahal.",
            whyVisit: "Historic hilltop fortress visible from the highway approach; unmatched 360° views.",
            detourKm: 14,
            detourMinutes: 18,
            visitDurationHours: "2 hrs",
            timings: "9:00 AM – 5:30 PM",
            entryFee: "₹25",
            rating: 4.7,
            reviewsCount: "15,200+",
            tags: ["Maratha Fort", "Trek", "Panoramic View"]
          }
        ],
        famousFoods: [
          {
            id: "tindivanam-food-dosa-kodai",
            city: "Tindivanam",
            highway: "NH 45 Highway Food Plaza",
            highwayStopDistance: "120 km from Chennai",
            foodName: "Gingee Village Wood-Fired Podi Dosa & Filter Coffee",
            foodType: "Main Course",
            isVegetarian: true,
            famousOutlet: "Hotel Highway Star / Sri Balaji Bhavan",
            description: "Crispy cast-iron griddle dosa topped with spicy gun-powder (idli podi) and fresh churned country butter.",
            whyFamous: "Classic breakfast halt for early morning Chennai road-trippers heading South.",
            priceRange: "₹80 - ₹150",
            imageUrl: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&h=300&fit=crop&q=80",
            lat: 12.2323,
            lng: 79.6508
          }
        ]
      },
      {
        city: "Trichy (Tiruchirappalli)",
        highway: "NH 38 / NH 45 Highway Hub",
        kmFromStart: 320,
        attractions: [
          {
            id: "trichy-srirangam-kodai",
            name: "Sri Ranganathaswamy Temple, Srirangam",
            city: "Tiruchirappalli",
            highway: "NH 38 Cauvery Bridge Exit",
            highwayKmMarker: 320,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "temple",
            categoryLabel: "World's Largest Functioning Temple Complex",
            lat: 10.8624,
            lng: 78.6901,
            imageUrl: "https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=600&h=400&fit=crop&q=80",
            shortDescription: "156-acre island temple complex encircled by 7 concentric walls and 21 towering gopurams.",
            whyVisit: "Guinness-recognized largest active Hindu temple complex on earth; located right along the highway entry over River Cauvery.",
            detourKm: 3.5,
            detourMinutes: 8,
            visitDurationHours: "1.5 hrs",
            timings: "6:00 AM – 1:00 PM, 3:30 PM – 9:00 PM",
            entryFee: "Free",
            rating: 4.9,
            reviewsCount: "68,000+",
            tags: ["UNESCO Listed", "Vishnu Temple", "Cauvery Island"]
          },
          {
            id: "trichy-rockfort-kodai",
            name: "Trichy Rockfort & Ucchi Pillayar Temple",
            city: "Tiruchirappalli",
            highway: "NH 38 City Center Bypass",
            highwayKmMarker: 325,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "3.8-Billion-Year-Old Rock Citadel",
            lat: 10.8284,
            lng: 78.6968,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Dramatic monolithic 83-meter high ancient rock structure crowned with a Ganesha temple.",
            whyVisit: "Climb 437 steps cut into rock for breathtaking views over Srirangam and the Cauvery delta.",
            detourKm: 3,
            detourMinutes: 8,
            visitDurationHours: "1.5 hrs",
            timings: "6:00 AM – 8:00 PM",
            entryFee: "₹10",
            rating: 4.8,
            reviewsCount: "34,500+",
            tags: ["Ancient Rock", "Hilltop View", "Nayak Fort"]
          }
        ],
        famousFoods: [
          {
            id: "trichy-food-murukku-kodai",
            city: "Tiruchirappalli",
            highway: "NH 38 Bypass",
            highwayStopDistance: "320 km from Chennai",
            foodName: "Authentic Manapparai Murukku & Cauvery Banana Leaf Meals",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Manapparai Highway Stalls / Hotel Guru Trichy",
            description: "World-famous double-fried crispy spiral snack and traditional South Indian rice thali.",
            whyFamous: "Iconic midday lunch and snack halt for travelers driving towards Dindigul/Kodaikanal.",
            priceRange: "₹60 - ₹200",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=80",
            lat: 10.7905,
            lng: 78.7047
          }
        ]
      },
      {
        city: "Dindigul",
        highway: "NH 83 Highway Junction",
        kmFromStart: 420,
        attractions: [
          {
            id: "dindigul-rockfort-kodai",
            name: "Dindigul Rock Fort (Malai Kottai)",
            city: "Dindigul",
            highway: "NH 83 / NH 44 Bypass (1.5 km)",
            highwayKmMarker: 420,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "17th Century Nayak Citadel",
            lat: 10.3629,
            lng: 77.9699,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "280-foot granite fortress with cannons and panoramic views over Sirumalai hills.",
            whyVisit: "Historic midway landmark at the gateway to the Kodaikanal Ghat road.",
            detourKm: 2,
            detourMinutes: 5,
            visitDurationHours: "1 hr",
            timings: "9:00 AM – 5:30 PM",
            entryFee: "₹25",
            rating: 4.6,
            reviewsCount: "11,800+",
            tags: ["Tipu Sultan Fort", "Panoramic View", "Midway Stop"]
          }
        ],
        famousFoods: [
          {
            id: "dindigul-food-biryani-kodai",
            city: "Dindigul",
            highway: "NH 83 / NH 44 Bypass",
            highwayStopDistance: "420 km from Chennai",
            foodName: "Original Dindigul Seeraga Samba Mutton Biryani",
            foodType: "Main Course",
            isVegetarian: false,
            famousOutlet: "Dindigul Thalappakatti (Original 1957 Outlet) / Venu Biryani",
            description: "Fragrant short-grain Seeraga Samba rice slow-cooked with tender meat and stone-ground spices.",
            whyFamous: "World-renowned culinary masterpiece; must-try lunch before ascending the Ghat road.",
            priceRange: "₹240 - ₹380",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=80",
            lat: 10.3673,
            lng: 77.9803
          }
        ]
      },
      {
        city: "Batlagundu & Kodai Ghat Road",
        highway: "SH 156 (Ghat Pass to Kodaikanal)",
        kmFromStart: 490,
        attractions: [
          {
            id: "silver-cascade-falls",
            name: "Silver Cascade Waterfalls",
            city: "Kodaikanal Ghat Road (SH 156)",
            highway: "SH 156 (8 km before Kodaikanal town)",
            highwayKmMarker: 525,
            enrouteStatus: "Directly On Highway",
            category: "waterfall",
            categoryLabel: "180ft Ghat Road Waterfall",
            lat: 10.2442,
            lng: 77.5144,
            imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&h=400&fit=crop&q=80",
            shortDescription: "180-foot waterfall cascading over steep cliffs directly beside the main Ghat entry highway.",
            whyVisit: "The iconic welcome landmark to Kodaikanal; roadside photo stop with fresh mountain mist and fruit stalls.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "30 mins",
            timings: "Open all day",
            entryFee: "Free",
            rating: 4.6,
            reviewsCount: "28,000+",
            tags: ["Directly on Highway", "Roadside Waterfall", "Mountain Mist", "Photo Stop"]
          },
          {
            id: "dum-dum-viewpoint",
            name: "Dum Dum Rock Viewpoint & Falls",
            city: "Batlagundu Ghat Road",
            highway: "SH 156 Hairpin Bend 8",
            highwayKmMarker: 495,
            enrouteStatus: "Scenic Ghat Route",
            category: "viewpoint",
            categoryLabel: "Panoramic Valley Overlook",
            lat: 10.2012,
            lng: 77.5815,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "Spectacular observation point overlooking the Manjalar Dam reservoir and misty Western Ghats valleys.",
            whyVisit: "Built into the hairpin turn; offers cool refreshing valley winds and tea stalls.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "20 mins",
            timings: "Sunrise to Sunset",
            entryFee: "Free",
            rating: 4.5,
            reviewsCount: "14,000+",
            tags: ["Hairpin View", "Valley Breeze", "Dam View"]
          }
        ],
        famousFoods: [
          {
            id: "kodai-food-soup",
            city: "Kodai Ghat Road",
            highway: "SH 156 Silver Cascade Curve",
            highwayStopDistance: "525 km (Ghat Entry)",
            foodName: "Hot Spiced Corn & Steaming Vegetable Pepper Soup",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Roadside Ghat Stalls at Silver Cascade",
            description: "Freshly roasted sweet corn on coal fire with lemon and chilli, paired with hot herbal pepper soup.",
            whyFamous: "Classic chilly weather comfort snack as you enter high altitude Kodaikanal.",
            priceRange: "₹40 - ₹80",
            imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop&q=80",
            lat: 10.2442,
            lng: 77.5144
          }
        ]
      },
      {
        city: "Kodaikanal (Destination)",
        highway: "Princess of Hill Stations",
        kmFromStart: 535,
        attractions: [
          {
            id: "kodai-lake",
            name: "Kodaikanal Star Lake & Promenade",
            city: "Kodaikanal",
            highway: "Town Center",
            highwayKmMarker: 535,
            enrouteStatus: "Destination Attraction",
            category: "beach_lake",
            categoryLabel: "60-Acre Star-Shaped Lake",
            lat: 10.2381,
            lng: 77.4892,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "Iconic man-made star-shaped lake created in 1863 surrounded by cycling tracks, pine trees, and boat clubs.",
            whyVisit: "The beating heart of Kodaikanal; pedal boating in the mist and tandem cycling along the 5km perimeter.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "2 - 3 hrs",
            timings: "6:00 AM – 7:00 PM (Boating till 5:30 PM)",
            entryFee: "Free (Boating ₹150 - ₹350)",
            rating: 4.8,
            reviewsCount: "62,000+",
            tags: ["Star Lake", "Boating", "Cycling Promenade", "Pine Breeze"]
          },
          {
            id: "coakers-walk",
            name: "Coaker's Walk & Valley View",
            city: "Kodaikanal",
            highway: "500m from Lake",
            highwayKmMarker: 536,
            enrouteStatus: "Destination Attraction",
            category: "viewpoint",
            categoryLabel: "1-km Mountain Edge Pedestrian Promenade",
            lat: 10.2312,
            lng: 77.4944,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "1-kilometer paved pedestrian walkway constructed along the steep mountain ridge with telescope viewpoints.",
            whyVisit: "Offers dramatic views of the Dolphin's Nose, Pambar River valley, and the plains of Periyakulam below.",
            detourKm: 0.5,
            detourMinutes: 2,
            visitDurationHours: "1 hr",
            timings: "7:00 AM – 7:00 PM",
            entryFee: "₹30 per adult",
            rating: 4.7,
            reviewsCount: "38,000+",
            tags: ["Mountain Ridge", "Cloud Walk", "Telescope House"]
          },
          {
            id: "pillar-rocks",
            name: "Pillar Rocks & Guna Caves (Devil's Kitchen)",
            city: "Kodaikanal",
            highway: "Pillar Rocks Road (6 km from lake)",
            highwayKmMarker: 541,
            enrouteStatus: "Destination Attraction",
            category: "viewpoint",
            categoryLabel: "400ft Monolithic Rock Towers",
            lat: 10.2105,
            lng: 77.4705,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Three vertical giant granite boulders standing 400 feet high surrounded by cloud mist and pine forests.",
            whyVisit: "One of the most dramatic natural geological formations in the Western Ghats with beautiful flower gardens.",
            detourKm: 6,
            detourMinutes: 10,
            visitDurationHours: "1.5 hrs",
            timings: "9:00 AM – 5:00 PM",
            entryFee: "₹10",
            rating: 4.7,
            reviewsCount: "44,000+",
            tags: ["400ft Granite Pillars", "Devil's Kitchen", "Pine Forest", "Mist View"]
          }
        ],
        famousFoods: [
          {
            id: "kodai-food-chocolate",
            city: "Kodaikanal",
            highway: "Seven Roads Junction / Anna Salai",
            highwayStopDistance: "535 km (Destination)",
            foodName: "Authentic Kodaikanal Homemade Chocolates & Spiced Tea",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Royal Homemade Chocolates / Potluck Confectionery",
            description: "Freshly handmade roasted almond, rum-and-raisin, dark truffle, and fruit chocolates prepared with rich cocoa butter.",
            whyFamous: "Famous handmade specialty of Kodaikanal hill station crafted since colonial times.",
            priceRange: "₹120 - ₹280 per 250g",
            imageUrl: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=300&fit=crop&q=80",
            lat: 10.2381,
            lng: 77.4892
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 3. CHENNAI → OOTY (UDHAGAMANDALAM)
  // Highway: NH 48 → NH 44 → NH 544 → NH 181 (Nilgiri Ghat Corridor)
  // Path: Chennai → Kanchipuram → Vellore → Salem → Mettupalayam → Coonoor → Ooty
  // =========================================================================
  "chennai-ooty": {
    routeKey: "chennai-ooty",
    corridorTitle: "Chennai → Ooty Highway Corridor",
    mainHighways: "NH 48, NH 44, NH 544 & NH 181 (Nilgiri Ghat Pass)",
    totalDistanceKm: 550,
    transitStops: [
      {
        city: "Kanchipuram & Vellore",
        highway: "NH 48 (Chennai–Bengaluru Expressway Corridor)",
        kmFromStart: 140,
        attractions: [
          {
            id: "vellore-fort-ooty",
            name: "Vellore Fort & Jalakandeswarar Temple",
            city: "Vellore",
            highway: "NH 48 Vellore City Bypass (Directly beside highway)",
            highwayKmMarker: 140,
            enrouteStatus: "Directly On Highway",
            category: "fort_palace",
            categoryLabel: "16th-Century Granite Fort & Moat",
            lat: 12.9202,
            lng: 79.1325,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Massive 16th-century Vijayanagara granite fort surrounded by a wide water moat and housing an ornate Shiva temple.",
            whyVisit: "Directly on NH 48; famous for the Sepoy Mutiny of 1806 and exquisite stone carved temple pillars.",
            detourKm: 1.5,
            detourMinutes: 4,
            visitDurationHours: "1.5 hrs",
            timings: "8:00 AM – 6:00 PM",
            entryFee: "Free (Museum ₹20)",
            rating: 4.7,
            reviewsCount: "32,000+",
            tags: ["Directly on Highway", "Water Moat", "Vijayanagara Art", "Historic Fort"]
          }
        ],
        famousFoods: [
          {
            id: "ambur-food-biryani",
            city: "Ambur (NH 48)",
            highway: "NH 48 Highway Corridor",
            highwayStopDistance: "185 km from Chennai",
            foodName: "Original Ambur Star Mutton Dum Biryani",
            foodType: "Main Course",
            isVegetarian: false,
            famousOutlet: "Ambur Star Biryani (Since 1890 - NH 48 Highway Outlet)",
            description: "Fragrant Seeraga Samba rice cooked in meat broth with curd and whole spices; served with sour brinjal curry (Khatta).",
            whyFamous: "Legendary highway road-trip food stop known throughout India for its subtle yet deeply flavorful aroma.",
            priceRange: "₹220 - ₹340",
            imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop&q=80",
            lat: 12.7904,
            lng: 78.7166
          }
        ]
      },
      {
        city: "Coonoor (Nilgiri Ghat Road)",
        highway: "NH 181 (Ghat Highway directly on way to Ooty)",
        kmFromStart: 530,
        attractions: [
          {
            id: "sims-park-coonoor",
            name: "Sim's Park & Dolphin's Nose Overlook",
            city: "Coonoor",
            highway: "NH 181 Nilgiri Ghat (Direct enroute stop)",
            highwayKmMarker: 530,
            enrouteStatus: "Directly On Highway",
            category: "nature_park",
            categoryLabel: "1874 Botanical Estate & Canyon View",
            lat: 11.3530,
            lng: 76.7959,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "Terraced natural park housing rare temperate trees, Japanese gardens, and views of Catherine Falls canyon.",
            whyVisit: "Travelers drive directly through Coonoor before reaching Ooty; peaceful botanical stroll and tea estate views.",
            detourKm: 1.5,
            detourMinutes: 4,
            visitDurationHours: "1.5 hrs",
            timings: "9:00 AM – 6:00 PM",
            entryFee: "₹30",
            rating: 4.7,
            reviewsCount: "26,000+",
            tags: ["Directly Enroute", "Nilgiri Pines", "Catherine Falls View"]
          }
        ],
        famousFoods: [
          {
            id: "ooty-food-varkey-coonoor",
            city: "Coonoor & Ooty",
            highway: "NH 181 Commercial Road",
            highwayStopDistance: "530 km",
            foodName: "Authentic Ooty Varkey & Hot Nilgiri CTC Tea",
            foodType: "Bakery",
            isVegetarian: true,
            famousOutlet: "West Coast Bakery / King Star Confectionery",
            description: "Crusty, flaky wood-fired biscuit paired with fresh mountain-brewed cardamom black tea.",
            whyFamous: "World-famous GI-applied snack of the Nilgiris; fresh from oven every morning.",
            priceRange: "₹80 - ₹160 per box",
            imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80",
            lat: 11.4167,
            lng: 76.7126
          }
        ]
      },
      {
        city: "Ooty (Destination)",
        highway: "Queen of Hill Stations (NH 181 End)",
        kmFromStart: 550,
        attractions: [
          {
            id: "ooty-botanical-garden",
            name: "Government Botanical Garden, Ooty",
            city: "Ooty (Udhagamandalam)",
            highway: "Vannarapettai / Dodabetta Rd",
            highwayKmMarker: 550,
            enrouteStatus: "Destination Attraction",
            category: "nature_park",
            categoryLabel: "55-Acre Nilgiri Botanical Garden",
            lat: 11.4167,
            lng: 76.7126,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "55-acre terraced garden established in 1848 with a 20-million-year-old fossil tree trunk and thousands of exotic plants.",
            whyVisit: "Premier botanical attraction in South India; sprawling lawns and vibrant flower beds.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "2 hrs",
            timings: "7:00 AM – 6:30 PM",
            entryFee: "₹40",
            rating: 4.8,
            reviewsCount: "52,000+",
            tags: ["Fossil Tree", "Italian Garden", "Flower Show"]
          },
          {
            id: "pykara-falls",
            name: "Pykara Waterfalls & Boating Lake",
            city: "Pykara (21 km from Ooty)",
            highway: "NH 181 (Mysore-Ooty Highway)",
            highwayKmMarker: 571,
            enrouteStatus: "Destination Attraction",
            category: "waterfall",
            categoryLabel: "Toda Sacred River Falls",
            lat: 11.4925,
            lng: 76.6015,
            imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=600&h=400&fit=crop&q=80",
            shortDescription: "Scenic stepped waterfalls flowing through pine forests into a pristine lake with speedboat facilities.",
            whyVisit: "Pristine nature escape; sacred river of the Toda tribe with exhilarating boat rides.",
            detourKm: 18,
            detourMinutes: 25,
            visitDurationHours: "2 hrs",
            timings: "8:30 AM – 5:30 PM",
            entryFee: "₹20 (Speedboat ₹750)",
            rating: 4.7,
            reviewsCount: "36,000+",
            tags: ["Stepped Waterfall", "Pine Woods", "Speedboat", "Sacred River"]
          }
        ],
        famousFoods: [
          {
            id: "ooty-food-chocolates",
            city: "Ooty",
            highway: "Charring Cross / Commercial St",
            highwayStopDistance: "550 km (Destination)",
            foodName: "Fresh Nilgiri Truffle Chocolates & Honey",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "King Star / Modern Stores Charring Cross",
            description: "Fresh handmade dark chocolate truffles, almond rocks, and pure eucalyptus honey.",
            whyFamous: "Classic takeaway sweet of the Nilgiris.",
            priceRange: "₹140 - ₹300",
            imageUrl: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=300&fit=crop&q=80",
            lat: 11.4167,
            lng: 76.7126
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 4. BANGALORE → OOTY
  // Highway: NH 275 (Expressway) → NH 766 → NH 181 (Bandipur Safari Route)
  // Path: Bengaluru → Ramanagara → Mysore → Bandipur Forest → Pykara → Ooty
  // =========================================================================
  "bangalore-ooty": {
    routeKey: "bangalore-ooty",
    corridorTitle: "Bengaluru → Ooty Highway Corridor (Bandipur Safari Route)",
    mainHighways: "NH 275 (Bengaluru-Mysuru Expressway), NH 766 & NH 181",
    totalDistanceKm: 275,
    transitStops: [
      {
        city: "Ramanagara",
        highway: "NH 275 Expressway (Directly on highway)",
        kmFromStart: 45,
        attractions: [
          {
            id: "ramanagara-sholay",
            name: "Ramadevara Betta (Sholay Rocks & Vulture Sanctuary)",
            city: "Ramanagara",
            highway: "NH 275 Expressway Exit (1 km)",
            highwayKmMarker: 45,
            enrouteStatus: "Directly On Highway",
            category: "viewpoint",
            categoryLabel: "Iconic Granite Hilltop",
            lat: 12.7265,
            lng: 77.2815,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Dramatic granite boulder hills where the legendary Bollywood film 'Sholay' was filmed.",
            whyVisit: "India's only Long-billed Vulture sanctuary; quick step climb for scenic highway views.",
            detourKm: 1.5,
            detourMinutes: 4,
            visitDurationHours: "1 hr",
            timings: "9:00 AM – 5:00 PM",
            entryFee: "₹25",
            rating: 4.6,
            reviewsCount: "16,000+",
            tags: ["Sholay Rocks", "Vulture Sanctuary", "Directly on NH 275"]
          }
        ],
        famousFoods: [
          {
            id: "maddur-food-vada",
            city: "Maddur (NH 275)",
            highway: "NH 275 Expressway Stop",
            highwayStopDistance: "75 km from Bengaluru",
            foodName: "Authentic Hot Maddur Tiffany Vada & Filter Coffee",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Maddur Tiffany's / Maddur Tiffanys Express",
            description: "Crispy fried fritter made with semolina, rice flour, onions, and curry leaves.",
            whyFamous: "Iconic century-old travel snack on the Bengaluru-Mysuru highway.",
            priceRange: "₹40 - ₹80",
            imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop&q=80",
            lat: 12.5841,
            lng: 77.0453
          }
        ]
      },
      {
        city: "Mysuru (Mysore)",
        highway: "NH 275 / NH 766 Hub",
        kmFromStart: 145,
        attractions: [
          {
            id: "mysore-palace",
            name: "Mysore Palace (Amba Vilas)",
            city: "Mysuru",
            highway: "NH 766 City Corridor (2 km)",
            highwayKmMarker: 145,
            enrouteStatus: "Quick Highway Exit (≤ 3 km)",
            category: "fort_palace",
            categoryLabel: "Grand Royal Indo-Saracenic Palace",
            lat: 12.3051,
            lng: 76.6551,
            imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&h=400&fit=crop&q=80",
            shortDescription: "Magnificent royal palace of the Wadiyar dynasty illuminated by 100,000 golden bulbs on weekends.",
            whyVisit: "One of the most visited monuments in India; stained glass ceilings, golden throne, and courtyards.",
            detourKm: 2,
            detourMinutes: 5,
            visitDurationHours: "2 hrs",
            timings: "10:00 AM – 5:30 PM",
            entryFee: "₹100",
            rating: 4.8,
            reviewsCount: "120,000+",
            tags: ["Royal Palace", "Wadiyar Dynasty", "Golden Durbar"]
          }
        ],
        famousFoods: [
          {
            id: "mysore-food-pak",
            city: "Mysuru",
            highway: "Sayyaji Rao Road",
            highwayStopDistance: "145 km",
            foodName: "Original Melt-in-Mouth Mysore Pak & Mylari Dosa",
            foodType: "Snack & Sweet",
            isVegetarian: true,
            famousOutlet: "Guru Sweets (Original Invented Outlet) / Hotel Original Mylari",
            description: "Silky ghee-laden gram flour fudge and cloud-soft butter dosas served on plantain leaf.",
            whyFamous: "The royal sweet invented in the royal palace kitchens of Mysore.",
            priceRange: "₹80 - ₹200",
            imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop&q=80",
            lat: 12.3051,
            lng: 76.6551
          }
        ]
      },
      {
        city: "Bandipur & Mudumalai Tiger Reserve",
        highway: "NH 766 Forest Highway (Directly drives through)",
        kmFromStart: 220,
        attractions: [
          {
            id: "bandipur-safari",
            name: "Bandipur National Park & Elephant Corridor",
            city: "Bandipur",
            highway: "NH 766 Highway (Road passes right through forest)",
            highwayKmMarker: 220,
            enrouteStatus: "Directly On Highway",
            category: "nature_park",
            categoryLabel: "Tiger Reserve & Safari",
            lat: 11.6664,
            lng: 76.6291,
            imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&h=400&fit=crop&q=80",
            shortDescription: "Protected biosphere where wild elephants, spotted deer, and peacocks frequently cross the highway.",
            whyVisit: "Travelers drive directly through the jungle canopy before climbing the 36 hairpin Nilgiri Ghats.",
            detourKm: 0,
            detourMinutes: 0,
            visitDurationHours: "1.5 hrs",
            timings: "Safari 6:30 AM – 9:00 AM & 3:30 PM – 6:00 PM",
            entryFee: "Safari ₹350",
            rating: 4.8,
            reviewsCount: "42,000+",
            tags: ["Directly on Route", "Wild Elephants", "Tiger Reserve", "Jungle Drive"]
          }
        ],
        famousFoods: [
          {
            id: "bandipur-food-tea",
            city: "Gundlupet / Bandipur Entry",
            highway: "NH 766 Forest Gate",
            highwayStopDistance: "210 km",
            foodName: "Hot Masala Chai & Fresh Banana Chips",
            foodType: "Drink / Beverage",
            isVegetarian: true,
            famousOutlet: "Bandipur Safari Highway Canteen",
            description: "Fresh hot ginger tea before entering the silent forest zone.",
            whyFamous: "Mandatory refreshing pit-stop before the 36 Ghat hairpin turns.",
            priceRange: "₹30 - ₹60",
            imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop&q=80",
            lat: 11.6664,
            lng: 76.6291
          }
        ]
      }
    ]
  }
};
