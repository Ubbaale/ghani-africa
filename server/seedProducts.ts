import { storage } from "./storage";

const SAMPLE_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Agriculture",
  "Manufacturing",
  "Home & Living",
  "Services",
  "Textiles",
];

const SAMPLE_PRODUCTS = [
  { sellerId: "sample-seller-1", name: "Handwoven Kente Cloth", description: "Traditional Ghanaian Kente cloth, handwoven with vibrant colors. Perfect for special occasions and cultural celebrations.", price: "150.00", images: ["https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400"], country: "Ghana", city: "Accra", isFeatured: true, categoryName: "Textiles" },
  { sellerId: "sample-seller-2", name: "Nigerian Ankara Fabric", description: "High-quality African wax print fabric, 6 yards. Bold patterns suitable for traditional and modern fashion.", price: "45.00", images: ["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400"], country: "Nigeria", city: "Lagos", isFeatured: true, categoryName: "Fashion" },
  { sellerId: "sample-seller-3", name: "Ethiopian Coffee Beans", description: "Premium Yirgacheffe coffee beans, single origin. Rich floral notes with bright acidity. 1kg bag.", price: "28.00", images: ["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400"], country: "Ethiopia", city: "Addis Ababa", isFeatured: true, categoryName: "Agriculture" },
  { sellerId: "sample-seller-4", name: "Moroccan Argan Oil", description: "Pure organic argan oil from Morocco. Cold-pressed for skincare and haircare. 100ml bottle.", price: "35.00", images: ["https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400"], country: "Morocco", city: "Marrakech", isFeatured: false, categoryName: "Home & Living" },
  { sellerId: "sample-seller-5", name: "Kenyan Macadamia Nuts", description: "Fresh roasted macadamia nuts from the Kenyan highlands. Salted and ready to eat. 500g pack.", price: "18.00", images: ["https://images.unsplash.com/photo-1606050477955-81d8cf0bf5a0?w=400"], country: "Kenya", city: "Nairobi", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-6", name: "South African Rooibos Tea", description: "Organic red bush tea from the Cederberg region. Naturally caffeine-free. 100 tea bags.", price: "12.00", images: ["https://images.unsplash.com/photo-1556679343-c1c1c9308e4e?w=400"], country: "South Africa", city: "Cape Town", isFeatured: true, categoryName: "Agriculture" },
  { sellerId: "sample-seller-7", name: "Tanzanian Tanzanite Jewelry", description: "Genuine tanzanite pendant with sterling silver chain. Ethically sourced from Tanzania.", price: "250.00", images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400"], country: "Tanzania", city: "Dar es Salaam", isFeatured: true, categoryName: "Fashion" },
  { sellerId: "sample-seller-8", name: "Ugandan Vanilla Beans", description: "Grade A vanilla beans from Uganda. Aromatic and perfect for baking. Pack of 10 beans.", price: "22.00", images: ["https://images.unsplash.com/photo-1631206753348-db44968fd440?w=400"], country: "Uganda", city: "Kampala", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-9", name: "Senegalese Shea Butter", description: "Unrefined raw shea butter from Senegal. Natural moisturizer for skin and hair. 500g jar.", price: "15.00", images: ["https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400"], country: "Senegal", city: "Dakar", isFeatured: false, categoryName: "Home & Living" },
  { sellerId: "sample-seller-10", name: "Egyptian Cotton Sheets", description: "Luxury 1000 thread count Egyptian cotton bed sheets. Queen size, breathable and soft.", price: "180.00", images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400"], country: "Egypt", city: "Cairo", isFeatured: true, categoryName: "Home & Living" },
  { sellerId: "sample-seller-11", name: "Rwandan Specialty Coffee", description: "Award-winning Rwandan single origin coffee. Notes of citrus and chocolate. 500g whole beans.", price: "24.00", images: ["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"], country: "Rwanda", city: "Kigali", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-12", name: "Zambian Emerald Ring", description: "Natural Zambian emerald set in 18k gold ring. Certified gemstone with deep green color.", price: "450.00", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400"], country: "Zambia", city: "Lusaka", isFeatured: true, categoryName: "Fashion" },
  { sellerId: "sample-seller-13", name: "Ivorian Cocoa Powder", description: "Premium cocoa powder from Ivory Coast. Rich and pure for baking and hot chocolate. 1kg bag.", price: "16.00", images: ["https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400"], country: "Ivory Coast", city: "Abidjan", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-14", name: "Tunisian Olive Oil", description: "Extra virgin olive oil from Tunisia. First cold press, organic certified. 750ml bottle.", price: "20.00", images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"], country: "Tunisia", city: "Tunis", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-15", name: "Botswana Basket Art", description: "Handcrafted traditional Botswana basket. Natural palm and dye materials. Decorative piece.", price: "85.00", images: ["https://images.unsplash.com/photo-1590422749897-47036da0b0ff?w=400"], country: "Botswana", city: "Gaborone", isFeatured: true, categoryName: "Home & Living" },
  { sellerId: "sample-seller-16", name: "Zimbabwean Stone Sculpture", description: "Hand-carved Shona stone sculpture from Zimbabwe. Unique artistic piece representing African heritage.", price: "320.00", images: ["https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400"], country: "Zimbabwe", city: "Harare", isFeatured: true, categoryName: "Home & Living" },
  { sellerId: "sample-seller-17", name: "Algerian Dates", description: "Premium Deglet Noor dates from Algeria. Sweet and nutritious. 2kg box.", price: "25.00", images: ["https://images.unsplash.com/photo-1593904809850-5f77d7b5e60c?w=400"], country: "Algeria", city: "Algiers", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-18", name: "Cameroonian Pepper", description: "Authentic Cameroon white pepper. Aromatic and flavorful spice. 250g pack.", price: "14.00", images: ["https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400"], country: "Cameroon", city: "Douala", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-19", name: "Benin Bronze Art", description: "Replica Benin bronze sculpture. Traditional West African art piece for display.", price: "175.00", images: ["https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400"], country: "Benin", city: "Cotonou", isFeatured: true, categoryName: "Home & Living" },
  { sellerId: "sample-seller-20", name: "Angolan Honey", description: "Pure wild honey from Angola. Raw and unfiltered. 500ml jar.", price: "18.00", images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400"], country: "Angola", city: "Luanda", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-21", name: "Burkina Faso Dye Cloth", description: "Traditional Bogolan mud cloth from Burkina Faso. Handmade with natural dyes.", price: "65.00", images: ["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400"], country: "Burkina Faso", city: "Ouagadougou", isFeatured: false, categoryName: "Textiles" },
  { sellerId: "sample-seller-22", name: "Malagasy Vanilla Extract", description: "Pure Madagascar vanilla extract. World-renowned quality. 100ml bottle.", price: "32.00", images: ["https://images.unsplash.com/photo-1631206753348-db44968fd440?w=400"], country: "Madagascar", city: "Antananarivo", isFeatured: true, categoryName: "Agriculture" },
  { sellerId: "sample-seller-23", name: "Malian Wooden Mask", description: "Traditional Dogon wooden mask from Mali. Authentic ceremonial art piece.", price: "145.00", images: ["https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400"], country: "Mali", city: "Bamako", isFeatured: true, categoryName: "Home & Living" },
  { sellerId: "sample-seller-24", name: "Mozambican Cashews", description: "Roasted and salted cashew nuts from Mozambique. Premium quality. 1kg bag.", price: "22.00", images: ["https://images.unsplash.com/photo-1563292769-4e05b684851a?w=400"], country: "Mozambique", city: "Maputo", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-25", name: "Nigerian Palm Oil", description: "Authentic red palm oil from Nigeria. Traditional cooking ingredient. 1 liter.", price: "12.00", images: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"], country: "Nigeria", city: "Benin City", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-26", name: "Ghanaian Cocoa Butter", description: "Pure unrefined cocoa butter from Ghana. For skincare and chocolate making. 500g.", price: "19.00", images: ["https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400"], country: "Ghana", city: "Kumasi", isFeatured: false, categoryName: "Agriculture" },
  { sellerId: "sample-seller-27", name: "Ethiopian Leather Bag", description: "Handcrafted leather messenger bag from Ethiopia. Traditional design with modern function.", price: "95.00", images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400"], country: "Ethiopia", city: "Addis Ababa", isFeatured: true, categoryName: "Fashion" },
  { sellerId: "sample-seller-28", name: "Kenyan Beaded Jewelry", description: "Maasai-inspired beaded necklace from Kenya. Handmade with colorful glass beads.", price: "38.00", images: ["https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400"], country: "Kenya", city: "Nairobi", isFeatured: false, categoryName: "Fashion" },
  { sellerId: "sample-seller-29", name: "South African Biltong", description: "Traditional dried cured beef from South Africa. Savory snack. 500g pack.", price: "28.00", images: ["https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400"], country: "South Africa", city: "Johannesburg", isFeatured: true, categoryName: "Agriculture" },
  { sellerId: "sample-seller-30", name: "Congolese Malachite Stone", description: "Polished malachite stone from DR Congo. Beautiful green mineral for collection.", price: "55.00", images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400"], country: "DR Congo", city: "Kinshasa", isFeatured: false, categoryName: "Home & Living" },
];

export async function seedSampleProducts() {
  try {
    const existingProducts = await storage.getProducts({ limit: 1 });
    if (existingProducts.length > 0) {
      return;
    }

    console.log("Seeding sample categories and products...");

    const categoryMap: Record<string, number> = {};
    for (const catName of SAMPLE_CATEGORIES) {
      let cat = await storage.getCategoryByName(catName);
      if (!cat) {
        cat = await storage.createCategory({ name: catName, slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
      }
      categoryMap[catName] = cat.id;
    }
    console.log(`  Created ${SAMPLE_CATEGORIES.length} categories`);

    for (const product of SAMPLE_PRODUCTS) {
      const { categoryName, ...productData } = product;
      const categoryId = categoryMap[categoryName] || undefined;
      await storage.createProduct({
        ...productData,
        categoryId,
        currency: "USD",
        condition: "new",
        moq: 1,
        stock: 100,
        isActive: true,
      });
    }
    console.log(`  Created ${SAMPLE_PRODUCTS.length} sample products`);
  } catch (error) {
    console.error("Failed to seed sample products:", error);
  }
}
