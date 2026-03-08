import { storage } from "./storage";
import { db } from "./db";
import { categories } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

interface CategoryDef {
  name: string;
  slug: string;
  icon: string;
  subcategories: { name: string; slug: string }[];
}

const ALIBABA_CATEGORIES: CategoryDef[] = [
  {
    name: "Agriculture",
    slug: "agriculture",
    icon: "leaf",
    subcategories: [
      { name: "Fresh Vegetables", slug: "fresh-vegetables" },
      { name: "Fresh Fruits", slug: "fresh-fruits" },
      { name: "Grains & Cereals", slug: "grains-cereals" },
      { name: "Nuts & Seeds", slug: "nuts-seeds" },
      { name: "Coffee & Tea", slug: "coffee-tea" },
      { name: "Spices & Herbs", slug: "spices-herbs" },
      { name: "Animal Products", slug: "animal-products" },
      { name: "Plant Seeds & Bulbs", slug: "plant-seeds-bulbs" },
      { name: "Dried Fruits", slug: "dried-fruits" },
      { name: "Honey & Bee Products", slug: "honey-bee-products" },
      { name: "Cooking Oils", slug: "cooking-oils" },
      { name: "Cocoa & Chocolate", slug: "cocoa-chocolate" },
      { name: "Tobacco", slug: "tobacco" },
      { name: "Flowers & Plants", slug: "flowers-plants" },
    ],
  },
  {
    name: "Apparel & Accessories",
    slug: "apparel-accessories",
    icon: "shirt",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Children's Clothing", slug: "childrens-clothing" },
      { name: "Traditional African Wear", slug: "traditional-african-wear" },
      { name: "Sportswear", slug: "sportswear" },
      { name: "Underwear & Sleepwear", slug: "underwear-sleepwear" },
      { name: "Wedding Dresses", slug: "wedding-dresses" },
      { name: "Uniforms & Workwear", slug: "uniforms-workwear" },
      { name: "Hats & Caps", slug: "hats-caps" },
      { name: "Belts & Suspenders", slug: "belts-suspenders" },
      { name: "Scarves & Wraps", slug: "scarves-wraps" },
      { name: "Gloves & Mittens", slug: "gloves-mittens" },
    ],
  },
  {
    name: "Automobiles & Motorcycles",
    slug: "automobiles-motorcycles",
    icon: "car",
    subcategories: [
      { name: "Cars", slug: "cars" },
      { name: "Motorcycles", slug: "motorcycles" },
      { name: "Trucks & Buses", slug: "trucks-buses" },
      { name: "Auto Parts & Accessories", slug: "auto-parts-accessories" },
      { name: "Tires & Wheels", slug: "tires-wheels" },
      { name: "Car Electronics", slug: "car-electronics" },
      { name: "Engine Parts", slug: "engine-parts" },
      { name: "Body Parts", slug: "body-parts" },
      { name: "Motorcycle Parts", slug: "motorcycle-parts" },
      { name: "Electric Vehicles", slug: "electric-vehicles" },
      { name: "Bicycle & Accessories", slug: "bicycle-accessories" },
    ],
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "sparkles",
    subcategories: [
      { name: "Skin Care", slug: "skin-care" },
      { name: "Hair Care & Styling", slug: "hair-care-styling" },
      { name: "Makeup & Cosmetics", slug: "makeup-cosmetics" },
      { name: "Fragrances & Perfumes", slug: "fragrances-perfumes" },
      { name: "Body Care", slug: "body-care" },
      { name: "Oral Care", slug: "oral-care" },
      { name: "Shea Butter & Natural Oils", slug: "shea-butter-natural-oils" },
      { name: "Hair Extensions & Wigs", slug: "hair-extensions-wigs" },
      { name: "Nail Care", slug: "nail-care" },
      { name: "Men's Grooming", slug: "mens-grooming" },
      { name: "Salon Equipment", slug: "salon-equipment" },
    ],
  },
  {
    name: "Chemicals",
    slug: "chemicals",
    icon: "flask-conical",
    subcategories: [
      { name: "Basic Organic Chemicals", slug: "basic-organic-chemicals" },
      { name: "Inorganic Chemicals", slug: "inorganic-chemicals" },
      { name: "Agrochemicals & Pesticides", slug: "agrochemicals-pesticides" },
      { name: "Dyestuffs & Pigments", slug: "dyestuffs-pigments" },
      { name: "Pharmaceutical Chemicals", slug: "pharmaceutical-chemicals" },
      { name: "Adhesives & Sealants", slug: "adhesives-sealants" },
      { name: "Catalysts & Chemical Auxiliaries", slug: "catalysts-chemical-auxiliaries" },
      { name: "Cleaning Agents", slug: "cleaning-agents" },
    ],
  },
  {
    name: "Construction & Real Estate",
    slug: "construction-real-estate",
    icon: "building",
    subcategories: [
      { name: "Building Materials", slug: "building-materials" },
      { name: "Doors & Windows", slug: "doors-windows" },
      { name: "Tiles & Flooring", slug: "tiles-flooring" },
      { name: "Plumbing & Sanitary", slug: "plumbing-sanitary" },
      { name: "Steel & Iron", slug: "steel-iron" },
      { name: "Cement & Concrete", slug: "cement-concrete" },
      { name: "Roofing Materials", slug: "roofing-materials" },
      { name: "Paint & Coatings", slug: "paint-coatings" },
      { name: "Solar Panels & Installation", slug: "solar-panels-installation" },
      { name: "Real Estate Services", slug: "real-estate-services" },
      { name: "Prefab Houses", slug: "prefab-houses" },
    ],
  },
  {
    name: "Consumer Electronics",
    slug: "consumer-electronics",
    icon: "smartphone",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Phone Accessories", slug: "phone-accessories" },
      { name: "Laptops & Computers", slug: "laptops-computers" },
      { name: "Tablets & E-Readers", slug: "tablets-e-readers" },
      { name: "TVs & Monitors", slug: "tvs-monitors" },
      { name: "Audio & Headphones", slug: "audio-headphones" },
      { name: "Cameras & Photography", slug: "cameras-photography" },
      { name: "Smart Watches & Wearables", slug: "smart-watches-wearables" },
      { name: "Gaming Consoles & Accessories", slug: "gaming-consoles-accessories" },
      { name: "Power Banks & Chargers", slug: "power-banks-chargers" },
      { name: "Computer Components", slug: "computer-components" },
    ],
  },
  {
    name: "Electrical Equipment & Supplies",
    slug: "electrical-equipment",
    icon: "zap",
    subcategories: [
      { name: "Wires & Cables", slug: "wires-cables" },
      { name: "Switches & Sockets", slug: "switches-sockets" },
      { name: "Generators", slug: "generators" },
      { name: "Transformers", slug: "transformers" },
      { name: "Batteries", slug: "batteries" },
      { name: "Solar Equipment", slug: "solar-equipment" },
      { name: "Circuit Breakers", slug: "circuit-breakers" },
      { name: "LED Lighting", slug: "led-lighting" },
      { name: "UPS & Power Protection", slug: "ups-power-protection" },
      { name: "Inverters", slug: "inverters" },
    ],
  },
  {
    name: "Energy",
    slug: "energy",
    icon: "sun",
    subcategories: [
      { name: "Solar Energy Products", slug: "solar-energy-products" },
      { name: "Wind Energy", slug: "wind-energy" },
      { name: "Gas & Oil Equipment", slug: "gas-oil-equipment" },
      { name: "Biofuels & Biomass", slug: "biofuels-biomass" },
      { name: "Energy Storage", slug: "energy-storage" },
      { name: "Charcoal & Briquettes", slug: "charcoal-briquettes" },
    ],
  },
  {
    name: "Environment",
    slug: "environment",
    icon: "trees",
    subcategories: [
      { name: "Water Treatment", slug: "water-treatment" },
      { name: "Waste Management", slug: "waste-management" },
      { name: "Air Purification", slug: "air-purification" },
      { name: "Recycling Equipment", slug: "recycling-equipment" },
      { name: "Environmental Consulting", slug: "environmental-consulting" },
    ],
  },
  {
    name: "Food & Beverage",
    slug: "food-beverage",
    icon: "utensils",
    subcategories: [
      { name: "Snack Foods", slug: "snack-foods" },
      { name: "Beverages", slug: "beverages" },
      { name: "Dairy Products", slug: "dairy-products" },
      { name: "Canned Food", slug: "canned-food" },
      { name: "Frozen Foods", slug: "frozen-foods" },
      { name: "Seasonings & Condiments", slug: "seasonings-condiments" },
      { name: "Bakery Products", slug: "bakery-products" },
      { name: "Meat & Poultry", slug: "meat-poultry" },
      { name: "Seafood & Fish", slug: "seafood-fish" },
      { name: "Baby Food", slug: "baby-food" },
      { name: "Organic Food", slug: "organic-food" },
      { name: "African Specialty Foods", slug: "african-specialty-foods" },
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    icon: "armchair",
    subcategories: [
      { name: "Living Room Furniture", slug: "living-room-furniture" },
      { name: "Bedroom Furniture", slug: "bedroom-furniture" },
      { name: "Office Furniture", slug: "office-furniture" },
      { name: "Outdoor Furniture", slug: "outdoor-furniture" },
      { name: "Kitchen Furniture", slug: "kitchen-furniture" },
      { name: "Children's Furniture", slug: "childrens-furniture" },
      { name: "Hotel Furniture", slug: "hotel-furniture" },
      { name: "School Furniture", slug: "school-furniture" },
      { name: "African Handcrafted Furniture", slug: "african-handcrafted-furniture" },
    ],
  },
  {
    name: "Health & Medical",
    slug: "health-medical",
    icon: "heart-pulse",
    subcategories: [
      { name: "Medical Supplies", slug: "medical-supplies" },
      { name: "Medical Equipment", slug: "medical-equipment" },
      { name: "Pharmaceuticals", slug: "pharmaceuticals" },
      { name: "Surgical Instruments", slug: "surgical-instruments" },
      { name: "Laboratory Equipment", slug: "laboratory-equipment" },
      { name: "Traditional & Herbal Medicine", slug: "traditional-herbal-medicine" },
      { name: "Personal Protective Equipment", slug: "personal-protective-equipment" },
      { name: "Health Supplements", slug: "health-supplements" },
      { name: "Diagnostic Equipment", slug: "diagnostic-equipment" },
    ],
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    icon: "home",
    subcategories: [
      { name: "Home Decor", slug: "home-decor" },
      { name: "Kitchen & Dining", slug: "kitchen-dining" },
      { name: "Bedding & Bath", slug: "bedding-bath" },
      { name: "Garden Supplies", slug: "garden-supplies" },
      { name: "Cleaning Supplies", slug: "cleaning-supplies" },
      { name: "Storage & Organization", slug: "storage-organization" },
      { name: "African Art & Crafts", slug: "african-art-crafts" },
      { name: "Candles & Fragrances", slug: "candles-fragrances" },
      { name: "Rugs & Carpets", slug: "rugs-carpets" },
      { name: "Home Appliances", slug: "home-appliances" },
    ],
  },
  {
    name: "Industrial Equipment & Components",
    slug: "industrial-equipment",
    icon: "cog",
    subcategories: [
      { name: "Pumps & Compressors", slug: "pumps-compressors" },
      { name: "Valves & Fittings", slug: "valves-fittings" },
      { name: "Bearings & Gears", slug: "bearings-gears" },
      { name: "Hydraulic & Pneumatic", slug: "hydraulic-pneumatic" },
      { name: "Material Handling", slug: "material-handling" },
      { name: "Welding Equipment", slug: "welding-equipment" },
      { name: "Industrial Filters", slug: "industrial-filters" },
      { name: "Conveyor Systems", slug: "conveyor-systems" },
    ],
  },
  {
    name: "Lights & Lighting",
    slug: "lights-lighting",
    icon: "lightbulb",
    subcategories: [
      { name: "LED Lights", slug: "led-lights" },
      { name: "Solar Lights", slug: "solar-lights" },
      { name: "Outdoor Lighting", slug: "outdoor-lighting" },
      { name: "Indoor Lighting", slug: "indoor-lighting" },
      { name: "Commercial Lighting", slug: "commercial-lighting" },
      { name: "Stage & Event Lighting", slug: "stage-event-lighting" },
      { name: "Street Lights", slug: "street-lights" },
    ],
  },
  {
    name: "Luggage, Bags & Cases",
    slug: "luggage-bags-cases",
    icon: "briefcase",
    subcategories: [
      { name: "Handbags", slug: "handbags" },
      { name: "Backpacks", slug: "backpacks" },
      { name: "Travel Bags & Luggage", slug: "travel-bags-luggage" },
      { name: "Wallets & Purses", slug: "wallets-purses" },
      { name: "School Bags", slug: "school-bags" },
      { name: "Shopping Bags", slug: "shopping-bags" },
      { name: "African Leather Bags", slug: "african-leather-bags" },
    ],
  },
  {
    name: "Machinery",
    slug: "machinery",
    icon: "wrench",
    subcategories: [
      { name: "Agricultural Machinery", slug: "agricultural-machinery" },
      { name: "Food Processing Machinery", slug: "food-processing-machinery" },
      { name: "Mining Machinery", slug: "mining-machinery" },
      { name: "Printing Machinery", slug: "printing-machinery" },
      { name: "Packaging Machinery", slug: "packaging-machinery" },
      { name: "Woodworking Machinery", slug: "woodworking-machinery" },
      { name: "Textile Machinery", slug: "textile-machinery" },
      { name: "Plastic & Rubber Machinery", slug: "plastic-rubber-machinery" },
      { name: "Construction Machinery", slug: "construction-machinery" },
      { name: "Water Well Drilling", slug: "water-well-drilling" },
    ],
  },
  {
    name: "Minerals & Metallurgy",
    slug: "minerals-metallurgy",
    icon: "gem",
    subcategories: [
      { name: "Gold & Precious Metals", slug: "gold-precious-metals" },
      { name: "Gemstones", slug: "gemstones" },
      { name: "Iron & Steel", slug: "iron-steel" },
      { name: "Copper & Copper Alloys", slug: "copper-copper-alloys" },
      { name: "Aluminum", slug: "aluminum" },
      { name: "Coal & Charcoal", slug: "coal-charcoal" },
      { name: "Sand & Gravel", slug: "sand-gravel" },
      { name: "Marble & Granite", slug: "marble-granite" },
    ],
  },
  {
    name: "Office & School Supplies",
    slug: "office-school-supplies",
    icon: "book-open",
    subcategories: [
      { name: "Stationery", slug: "stationery" },
      { name: "Office Electronics", slug: "office-electronics" },
      { name: "Printers & Scanners", slug: "printers-scanners" },
      { name: "Office Furniture", slug: "office-furniture-supplies" },
      { name: "School Supplies", slug: "school-supplies" },
      { name: "Presentation Equipment", slug: "presentation-equipment" },
      { name: "Writing Instruments", slug: "writing-instruments" },
    ],
  },
  {
    name: "Packaging & Printing",
    slug: "packaging-printing",
    icon: "package",
    subcategories: [
      { name: "Paper Packaging", slug: "paper-packaging" },
      { name: "Plastic Packaging", slug: "plastic-packaging" },
      { name: "Glass Packaging", slug: "glass-packaging" },
      { name: "Metal Packaging", slug: "metal-packaging" },
      { name: "Labels & Tags", slug: "labels-tags" },
      { name: "Printing Services", slug: "printing-services" },
      { name: "Packaging Machinery", slug: "packaging-machinery-supplies" },
    ],
  },
  {
    name: "Security & Protection",
    slug: "security-protection",
    icon: "shield",
    subcategories: [
      { name: "CCTV & Surveillance", slug: "cctv-surveillance" },
      { name: "Access Control", slug: "access-control" },
      { name: "Alarm Systems", slug: "alarm-systems" },
      { name: "Fire Safety", slug: "fire-safety" },
      { name: "Security Guards Equipment", slug: "security-guards-equipment" },
      { name: "Safes & Locks", slug: "safes-locks" },
      { name: "Metal Detectors", slug: "metal-detectors" },
    ],
  },
  {
    name: "Shoes & Footwear",
    slug: "shoes-footwear",
    icon: "footprints",
    subcategories: [
      { name: "Men's Shoes", slug: "mens-shoes" },
      { name: "Women's Shoes", slug: "womens-shoes" },
      { name: "Children's Shoes", slug: "childrens-shoes" },
      { name: "Sports Shoes", slug: "sports-shoes" },
      { name: "Sandals & Slippers", slug: "sandals-slippers" },
      { name: "Safety & Work Boots", slug: "safety-work-boots" },
      { name: "African Leather Shoes", slug: "african-leather-shoes" },
    ],
  },
  {
    name: "Sports & Entertainment",
    slug: "sports-entertainment",
    icon: "trophy",
    subcategories: [
      { name: "Fitness Equipment", slug: "fitness-equipment" },
      { name: "Team Sports", slug: "team-sports" },
      { name: "Outdoor Sports", slug: "outdoor-sports" },
      { name: "Water Sports", slug: "water-sports" },
      { name: "Musical Instruments", slug: "musical-instruments" },
      { name: "Party Supplies", slug: "party-supplies" },
      { name: "Camping & Hiking", slug: "camping-hiking" },
      { name: "African Drums & Instruments", slug: "african-drums-instruments" },
    ],
  },
  {
    name: "Telecommunications",
    slug: "telecommunications",
    icon: "radio",
    subcategories: [
      { name: "Telecom Parts", slug: "telecom-parts" },
      { name: "Networking Equipment", slug: "networking-equipment" },
      { name: "Fiber Optic Equipment", slug: "fiber-optic-equipment" },
      { name: "Satellite Equipment", slug: "satellite-equipment" },
      { name: "Communication Antennas", slug: "communication-antennas" },
      { name: "POS Systems", slug: "pos-systems" },
    ],
  },
  {
    name: "Textiles & Leather",
    slug: "textiles-leather",
    icon: "scissors",
    subcategories: [
      { name: "African Print Fabrics", slug: "african-print-fabrics" },
      { name: "Cotton Fabrics", slug: "cotton-fabrics" },
      { name: "Silk & Satin", slug: "silk-satin" },
      { name: "Lace & Embroidery", slug: "lace-embroidery" },
      { name: "Leather & Hides", slug: "leather-hides" },
      { name: "Yarn & Thread", slug: "yarn-thread" },
      { name: "Kente & Ankara", slug: "kente-ankara" },
      { name: "Denim & Jeans Fabric", slug: "denim-jeans-fabric" },
      { name: "Upholstery Fabric", slug: "upholstery-fabric" },
    ],
  },
  {
    name: "Tools & Hardware",
    slug: "tools-hardware",
    icon: "hammer",
    subcategories: [
      { name: "Hand Tools", slug: "hand-tools" },
      { name: "Power Tools", slug: "power-tools" },
      { name: "Measuring Tools", slug: "measuring-tools" },
      { name: "Fasteners & Hardware", slug: "fasteners-hardware" },
      { name: "Cutting Tools", slug: "cutting-tools" },
      { name: "Abrasives", slug: "abrasives" },
      { name: "Tool Sets", slug: "tool-sets" },
    ],
  },
  {
    name: "Toys & Hobbies",
    slug: "toys-hobbies",
    icon: "puzzle",
    subcategories: [
      { name: "Educational Toys", slug: "educational-toys" },
      { name: "Dolls & Stuffed Toys", slug: "dolls-stuffed-toys" },
      { name: "Outdoor Play", slug: "outdoor-play" },
      { name: "Board Games & Puzzles", slug: "board-games-puzzles" },
      { name: "Remote Control Toys", slug: "remote-control-toys" },
      { name: "Baby Toys", slug: "baby-toys" },
      { name: "African Cultural Toys", slug: "african-cultural-toys" },
    ],
  },
  {
    name: "Transportation",
    slug: "transportation",
    icon: "truck",
    subcategories: [
      { name: "Shipping & Logistics", slug: "shipping-logistics" },
      { name: "Boats & Marine", slug: "boats-marine" },
      { name: "Rail Transport", slug: "rail-transport" },
      { name: "Air Transport", slug: "air-transport" },
      { name: "Trailers", slug: "trailers" },
      { name: "Forklifts & Warehouse", slug: "forklifts-warehouse" },
    ],
  },
  {
    name: "Jewelry & Watches",
    slug: "jewelry-watches",
    icon: "watch",
    subcategories: [
      { name: "Gold Jewelry", slug: "gold-jewelry" },
      { name: "Silver Jewelry", slug: "silver-jewelry" },
      { name: "Fashion Jewelry", slug: "fashion-jewelry" },
      { name: "Beaded Jewelry", slug: "beaded-jewelry" },
      { name: "Watches", slug: "watches" },
      { name: "African Traditional Jewelry", slug: "african-traditional-jewelry" },
      { name: "Gemstone Jewelry", slug: "gemstone-jewelry" },
    ],
  },
];

export async function seedCategories() {
  try {
    const existing = await db.select().from(categories).where(isNull(categories.parentId));
    if (existing.length > 15) {
      console.log(`Categories already seeded (${existing.length} top-level categories found)`);
      return;
    }

    console.log("Seeding Alibaba-style categories...");

    const existingSlugs = new Set(
      (await db.select().from(categories)).map(c => c.slug)
    );

    let mainCount = 0;
    let subCount = 0;

    for (const cat of ALIBABA_CATEGORIES) {
      let parentId: number;

      if (existingSlugs.has(cat.slug)) {
        const [existing] = await db.select().from(categories).where(eq(categories.slug, cat.slug));
        parentId = existing.id;
        if (!existing.icon || existing.icon !== cat.icon) {
          await db.update(categories).set({ icon: cat.icon }).where(eq(categories.id, existing.id));
        }
      } else {
        const [created] = await db.insert(categories).values({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          parentId: null,
        }).returning();
        parentId = created.id;
        mainCount++;
      }

      for (const sub of cat.subcategories) {
        if (!existingSlugs.has(sub.slug)) {
          await db.insert(categories).values({
            name: sub.name,
            slug: sub.slug,
            icon: null,
            parentId,
          });
          subCount++;
        }
      }
    }

    console.log(`  Added ${mainCount} main categories and ${subCount} subcategories`);
    console.log(`  Total: ${ALIBABA_CATEGORIES.length} main categories with ${ALIBABA_CATEGORIES.reduce((sum, c) => sum + c.subcategories.length, 0)} subcategories`);
  } catch (error) {
    console.error("Failed to seed categories:", error);
  }
}
