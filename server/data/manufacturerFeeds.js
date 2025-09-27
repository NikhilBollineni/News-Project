/**
 * 🏭 MANUFACTURER NEWS FEEDS
 * Official manufacturer news feeds and press releases
 * Covers: Major automakers, EV companies, luxury brands, commercial vehicles
 */

const manufacturerFeeds = [
  // ===== ELECTRIC VEHICLE MANUFACTURERS =====
  {
    name: "Tesla News",
    website: "https://www.tesla.com",
    rssFeed: "https://www.tesla.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Tesla", "EV Technology", "Autonomous Driving"],
    isActive: true
  },
  {
    name: "Rivian News",
    website: "https://rivian.com",
    rssFeed: "https://rivian.com/news/rss.xml",
    region: "North America",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Rivian", "Electric Trucks", "Adventure Vehicles"],
    isActive: true
  },
  {
    name: "Lucid Motors",
    website: "https://lucidmotors.com",
    rssFeed: "https://lucidmotors.com/news/rss.xml",
    region: "North America",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Lucid", "Luxury EVs", "Air Sedan"],
    isActive: true
  },
  {
    name: "Fisker News",
    website: "https://fiskerinc.com",
    rssFeed: "https://fiskerinc.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Fisker", "Ocean SUV", "Sustainable Mobility"],
    isActive: true
  },
  {
    name: "Polestar News",
    website: "https://polestar.com",
    rssFeed: "https://polestar.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Polestar", "Performance EVs", "Volvo"],
    isActive: true
  },

  // ===== TRADITIONAL MANUFACTURERS =====
  {
    name: "Ford News",
    website: "https://media.ford.com",
    rssFeed: "https://media.ford.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Ford", "F-150", "Mustang", "EVs"],
    isActive: true
  },
  {
    name: "General Motors News",
    website: "https://media.gm.com",
    rssFeed: "https://media.gm.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["GM", "Chevrolet", "Cadillac", "EVs"],
    isActive: true
  },
  {
    name: "Stellantis News",
    website: "https://media.stellantis.com",
    rssFeed: "https://media.stellantis.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Stellantis", "Jeep", "Ram", "Chrysler"],
    isActive: true
  },
  {
    name: "Toyota News",
    website: "https://global.toyota",
    rssFeed: "https://global.toyota/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Toyota", "Lexus", "Hybrid", "EVs"],
    isActive: true
  },
  {
    name: "Honda News",
    website: "https://hondanews.com",
    rssFeed: "https://hondanews.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Honda", "Acura", "Hybrid", "EVs"],
    isActive: true
  },
  {
    name: "Nissan News",
    website: "https://global.nissannews.com",
    rssFeed: "https://global.nissannews.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Nissan", "Infiniti", "Leaf", "EVs"],
    isActive: true
  },
  {
    name: "Hyundai News",
    website: "https://www.hyundai.news",
    rssFeed: "https://www.hyundai.news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Hyundai", "Genesis", "EVs", "Fuel Cell"],
    isActive: true
  },
  {
    name: "Kia News",
    website: "https://www.kia.com",
    rssFeed: "https://www.kia.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["Kia", "EV6", "EVs", "Design"],
    isActive: true
  },

  // ===== EUROPEAN MANUFACTURERS =====
  {
    name: "Volkswagen News",
    website: "https://www.volkswagen-newsroom.com",
    rssFeed: "https://www.volkswagen-newsroom.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "General Automotive",
    specialties: ["VW", "ID Series", "EVs", "Audi"],
    isActive: true
  },
  {
    name: "BMW News",
    website: "https://www.press.bmwgroup.com",
    rssFeed: "https://www.press.bmwgroup.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Luxury Automotive",
    specialties: ["BMW", "i Series", "EVs", "Performance"],
    isActive: true
  },
  {
    name: "Mercedes-Benz News",
    website: "https://media.mercedes-benz.com",
    rssFeed: "https://media.mercedes-benz.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Luxury Automotive",
    specialties: ["Mercedes", "EQ Series", "EVs", "Luxury"],
    isActive: true
  },
  {
    name: "Audi News",
    website: "https://www.audi-mediacenter.com",
    rssFeed: "https://www.audi-mediacenter.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Luxury Automotive",
    specialties: ["Audi", "e-tron", "EVs", "Quattro"],
    isActive: true
  },
  {
    name: "Porsche News",
    website: "https://newsroom.porsche.com",
    rssFeed: "https://newsroom.porsche.com/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Sports Cars",
    specialties: ["Porsche", "Taycan", "EVs", "Performance"],
    isActive: true
  },
  {
    name: "Ferrari News",
    website: "https://www.ferrari.com",
    rssFeed: "https://www.ferrari.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Supercars",
    specialties: ["Ferrari", "Supercars", "Racing", "Luxury"],
    isActive: true
  },
  {
    name: "Lamborghini News",
    website: "https://www.lamborghini.com",
    rssFeed: "https://www.lamborghini.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Supercars",
    specialties: ["Lamborghini", "Supercars", "Racing", "Luxury"],
    isActive: true
  },
  {
    name: "McLaren News",
    website: "https://cars.mclaren.com",
    rssFeed: "https://cars.mclaren.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Supercars",
    specialties: ["McLaren", "Supercars", "Racing", "Performance"],
    isActive: true
  },

  // ===== CHINESE MANUFACTURERS =====
  {
    name: "BYD News",
    website: "https://www.byd.com",
    rssFeed: "https://www.byd.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["BYD", "EVs", "Battery Technology", "Global"],
    isActive: true
  },
  {
    name: "NIO News",
    website: "https://www.nio.com",
    rssFeed: "https://www.nio.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["NIO", "EVs", "Battery Swapping", "Luxury"],
    isActive: true
  },
  {
    name: "XPeng News",
    website: "https://www.xpeng.com",
    rssFeed: "https://www.xpeng.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["XPeng", "EVs", "Autonomous Driving", "Technology"],
    isActive: true
  },
  {
    name: "Li Auto News",
    website: "https://www.lixiang.com",
    rssFeed: "https://www.lixiang.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Li Auto", "EVs", "Range Extender", "SUVs"],
    isActive: true
  },

  // ===== COMMERCIAL VEHICLE MANUFACTURERS =====
  {
    name: "Freightliner News",
    website: "https://www.freightliner.com",
    rssFeed: "https://www.freightliner.com/news/rss.xml",
    region: "North America",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Freightliner", "Trucks", "Commercial EVs", "Fleet"],
    isActive: true
  },
  {
    name: "Peterbilt News",
    website: "https://www.peterbilt.com",
    rssFeed: "https://www.peterbilt.com/news/rss.xml",
    region: "North America",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Peterbilt", "Trucks", "Commercial EVs", "Fleet"],
    isActive: true
  },
  {
    name: "Volvo Trucks News",
    website: "https://www.volvotrucks.com",
    rssFeed: "https://www.volvotrucks.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Volvo Trucks", "Commercial EVs", "Safety", "Fleet"],
    isActive: true
  },
  {
    name: "Scania News",
    website: "https://www.scania.com",
    rssFeed: "https://www.scania.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Scania", "Trucks", "Commercial EVs", "Sustainability"],
    isActive: true
  },

  // ===== MOTORCYCLE MANUFACTURERS =====
  {
    name: "Harley-Davidson News",
    website: "https://www.harley-davidson.com",
    rssFeed: "https://www.harley-davidson.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Motorcycles",
    specialties: ["Harley-Davidson", "Motorcycles", "Electric Bikes", "Lifestyle"],
    isActive: true
  },
  {
    name: "Ducati News",
    website: "https://www.ducati.com",
    rssFeed: "https://www.ducati.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Motorcycles",
    specialties: ["Ducati", "Sport Bikes", "Racing", "Performance"],
    isActive: true
  },
  {
    name: "Yamaha News",
    website: "https://www.yamaha-motor.com",
    rssFeed: "https://www.yamaha-motor.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Motorcycles",
    specialties: ["Yamaha", "Motorcycles", "Racing", "Technology"],
    isActive: true
  },
  {
    name: "Kawasaki News",
    website: "https://www.kawasaki.com",
    rssFeed: "https://www.kawasaki.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Motorcycles",
    specialties: ["Kawasaki", "Motorcycles", "Racing", "Performance"],
    isActive: true
  },

  // ===== AUTONOMOUS VEHICLE COMPANIES =====
  {
    name: "Waymo News",
    website: "https://waymo.com",
    rssFeed: "https://waymo.com/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Autonomous Vehicles",
    specialties: ["Waymo", "Autonomous Driving", "Robotaxis", "AI"],
    isActive: true
  },
  {
    name: "Cruise News",
    website: "https://www.getcruise.com",
    rssFeed: "https://www.getcruise.com/news/rss.xml",
    region: "North America",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Autonomous Vehicles",
    specialties: ["Cruise", "Autonomous Driving", "Robotaxis", "GM"],
    isActive: true
  },
  {
    name: "Argo AI News",
    website: "https://www.argo.ai",
    rssFeed: "https://www.argo.ai/news/rss.xml",
    region: "Global",
    language: "English",
    credibility: "Official",
    automotiveFocus: "Autonomous Vehicles",
    specialties: ["Argo AI", "Autonomous Driving", "Ford", "VW"],
    isActive: true
  }
];

module.exports = manufacturerFeeds;
