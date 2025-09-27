/**
 * 🌍 GLOBAL AUTOMOTIVE NEWS FEEDS
 * Comprehensive collection of automotive news sources worldwide
 * Covers: News, Racing, Commercial, Motorcycles, Classic Cars, Industry Analysis
 */

const globalAutomotiveNewsFeeds = [
  // ===== NORTH AMERICA =====
  {
    name: "Tesla News",
    website: "https://www.teslarati.com",
    rssFeed: "https://www.teslarati.com/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["Tesla", "EV Technology", "Autonomous Driving"],
    isActive: true
  },
  {
    name: "InsideEVs",
    website: "https://insideevs.com",
    rssFeed: "https://insideevs.com/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["EV News", "Battery Technology", "Charging Infrastructure"],
    isActive: true
  },
  {
    name: "Electrek",
    website: "https://electrek.co",
    rssFeed: "https://electrek.co/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["EV Technology", "Clean Energy", "Tesla"],
    isActive: true
  },
  {
    name: "CleanTechnica",
    website: "https://cleantechnica.com",
    rssFeed: "https://cleantechnica.com/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Clean Technology",
    specialties: ["EV News", "Renewable Energy", "Climate Tech"],
    isActive: true
  },
  {
    name: "Jalopnik",
    website: "https://jalopnik.com",
    rssFeed: "https://jalopnik.com/rss",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "Industry News", "Racing"],
    isActive: true
  },
  {
    name: "Autoblog",
    website: "https://www.autoblog.com",
    rssFeed: "https://www.autoblog.com/rss.xml",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car News", "Reviews", "Industry Analysis"],
    isActive: true
  },
  {
    name: "Car and Driver",
    website: "https://www.caranddriver.com",
    rssFeed: "https://feeds.feedburner.com/caranddriver/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "Performance", "Luxury Cars"],
    isActive: true
  },
  {
    name: "Motor Trend",
    website: "https://www.motortrend.com",
    rssFeed: "https://feeds.feedburner.com/motortrend/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "Racing", "Trucks"],
    isActive: true
  },
  {
    name: "Road & Track",
    website: "https://www.roadandtrack.com",
    rssFeed: "https://www.roadandtrack.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Performance Cars",
    specialties: ["Sports Cars", "Racing", "Performance"],
    isActive: true
  },
  {
    name: "AutoWeek",
    website: "https://www.autoweek.com",
    rssFeed: "https://www.autoweek.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Racing", "Industry News", "Performance"],
    isActive: true
  },

  // ===== EUROPE =====
  {
    name: "Auto Express",
    website: "https://www.autoexpress.co.uk",
    rssFeed: "https://www.autoexpress.co.uk/feeds/all.rss",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["UK Cars", "Reviews", "Industry News"],
    isActive: true
  },
  {
    name: "Top Gear",
    website: "https://www.topgear.com",
    rssFeed: "https://www.topgear.com/rss",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "Entertainment", "Performance"],
    isActive: true
  },
  {
    name: "Car Magazine",
    website: "https://www.carmagazine.co.uk",
    rssFeed: "https://www.carmagazine.co.uk/feed/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "UK Market", "Performance"],
    isActive: true
  },
  {
    name: "EV Magazine",
    website: "https://www.evmagazine.com",
    rssFeed: "https://www.evmagazine.com/feed/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["EV News", "European EVs", "Charging"],
    isActive: true
  },
  {
    name: "Autocar",
    website: "https://www.autocar.co.uk",
    rssFeed: "https://www.autocar.co.uk/rss",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Car Reviews", "UK Market", "Industry News"],
    isActive: true
  },
  {
    name: "Motorsport.com",
    website: "https://www.motorsport.com",
    rssFeed: "https://www.motorsport.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Racing",
    specialties: ["F1", "Motorsport", "Racing News"],
    isActive: true
  },
  {
    name: "Autosport",
    website: "https://www.autosport.com",
    rssFeed: "https://www.autosport.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Racing",
    specialties: ["F1", "WRC", "Motorsport"],
    isActive: true
  },

  // ===== ASIA =====
  {
    name: "China Daily Auto",
    website: "https://www.chinadaily.com.cn",
    rssFeed: "https://www.chinadaily.com.cn/rss/autonews.xml",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Chinese Market", "EV News", "Industry Analysis"],
    isActive: true
  },
  {
    name: "Nikkei Automotive",
    website: "https://asia.nikkei.com",
    rssFeed: "https://asia.nikkei.com/rss/automotive",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Industry Analysis", "Technology"],
    isActive: true
  },
  {
    name: "Korea Times Auto",
    website: "https://www.koreatimes.co.kr",
    rssFeed: "https://www.koreatimes.co.kr/rss/automotive.xml",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Korean Market", "Hyundai", "Kia"],
    isActive: true
  },

  // ===== SPECIALIZED CATEGORIES =====
  
  // Commercial Vehicles
  {
    name: "Fleet Owner",
    website: "https://www.fleetowner.com",
    rssFeed: "https://www.fleetowner.com/rss",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Trucks", "Fleet Management", "Commercial EVs"],
    isActive: true
  },
  {
    name: "Commercial Vehicle News",
    website: "https://www.cvnews.com",
    rssFeed: "https://www.cvnews.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Trucks", "Buses", "Commercial EVs"],
    isActive: true
  },

  // Motorcycles
  {
    name: "Cycle World",
    website: "https://www.cycleworld.com",
    rssFeed: "https://www.cycleworld.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Motorcycles",
    specialties: ["Motorcycle Reviews", "Racing", "Technology"],
    isActive: true
  },
  {
    name: "Motorcycle.com",
    website: "https://www.motorcycle.com",
    rssFeed: "https://www.motorcycle.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Motorcycles",
    specialties: ["Motorcycle News", "Reviews", "Racing"],
    isActive: true
  },

  // Classic Cars
  {
    name: "Hemmings",
    website: "https://www.hemmings.com",
    rssFeed: "https://www.hemmings.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Classic Cars",
    specialties: ["Classic Cars", "Restoration", "Collector Cars"],
    isActive: true
  },
  {
    name: "Classic & Sports Car",
    website: "https://www.classicandsportscar.com",
    rssFeed: "https://www.classicandsportscar.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Classic Cars",
    specialties: ["Classic Cars", "Vintage", "Collector Cars"],
    isActive: true
  },

  // Industry Analysis
  {
    name: "Automotive News",
    website: "https://www.autonews.com",
    rssFeed: "https://www.autonews.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Industry News", "Business Analysis", "Market Trends"],
    isActive: true
  },
  {
    name: "WardsAuto",
    website: "https://www.wardsauto.com",
    rssFeed: "https://www.wardsauto.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Industry Analysis", "Market Data", "Business News"],
    isActive: true
  },
  {
    name: "Just Auto",
    website: "https://www.just-auto.com",
    rssFeed: "https://www.just-auto.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Industry Analysis", "Market Research", "Business News"],
    isActive: true
  },

  // Technology & Innovation
  {
    name: "The Verge - Transportation",
    website: "https://www.theverge.com",
    rssFeed: "https://www.theverge.com/transportation/rss/index.xml",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Technology",
    specialties: ["Autonomous Vehicles", "EV Technology", "Mobility"],
    isActive: true
  },
  {
    name: "TechCrunch - Transportation",
    website: "https://techcrunch.com",
    rssFeed: "https://techcrunch.com/category/transportation/feed/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Technology",
    specialties: ["Startups", "EV Technology", "Mobility Innovation"],
    isActive: true
  },
  {
    name: "Ars Technica - Cars",
    website: "https://arstechnica.com",
    rssFeed: "https://feeds.arstechnica.com/arstechnica/cars/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Technology",
    specialties: ["EV Technology", "Autonomous Vehicles", "Innovation"],
    isActive: true
  },

  // Racing & Motorsport
  {
    name: "ESPN F1",
    website: "https://www.espn.com",
    rssFeed: "https://www.espn.com/racing/rss.xml",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Racing",
    specialties: ["F1", "Motorsport", "Racing News"],
    isActive: true
  },
  {
    name: "Racer",
    website: "https://racer.com",
    rssFeed: "https://racer.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Racing",
    specialties: ["IndyCar", "IMSA", "Racing News"],
    isActive: true
  },
  {
    name: "Motorsport Network",
    website: "https://www.motorsportnetwork.com",
    rssFeed: "https://www.motorsportnetwork.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Racing",
    specialties: ["F1", "WEC", "Motorsport"],
    isActive: true
  },

  // Regional Sources
  {
    name: "Auto Bild",
    website: "https://www.autobild.de",
    rssFeed: "https://www.autobild.de/rss/",
    region: "Europe",
    language: "German",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["German Market", "Car Reviews", "Industry News"],
    isActive: true
  },
  {
    name: "Auto Motor und Sport",
    website: "https://www.auto-motor-und-sport.de",
    rssFeed: "https://www.auto-motor-und-sport.de/rss/",
    region: "Europe",
    language: "German",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["German Market", "Performance", "Reviews"],
    isActive: true
  },
  {
    name: "L'Automobile Magazine",
    website: "https://www.lautomobile.fr",
    rssFeed: "https://www.lautomobile.fr/rss/",
    region: "Europe",
    language: "French",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["French Market", "Car Reviews", "Industry News"],
    isActive: true
  },
  {
    name: "Auto Express Italia",
    website: "https://www.autoexpress.it",
    rssFeed: "https://www.autoexpress.it/rss/",
    region: "Europe",
    language: "Italian",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Italian Market", "Ferrari", "Lamborghini"],
    isActive: true
  },

  // Japanese Sources
  {
    name: "Response",
    website: "https://response.jp",
    rssFeed: "https://response.jp/rss/",
    region: "Asia",
    language: "Japanese",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Toyota", "Honda"],
    isActive: true
  },
  {
    name: "Car Watch",
    website: "https://car.watch.impress.co.jp",
    rssFeed: "https://car.watch.impress.co.jp/rss/",
    region: "Asia",
    language: "Japanese",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Technology", "Reviews"],
    isActive: true
  }
];

module.exports = globalAutomotiveNewsFeeds;
