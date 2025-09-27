/**
 * 📊 INDUSTRY PUBLICATIONS & ANALYSIS
 * Trade publications and industry analysis sources
 * Covers: Business analysis, market research, industry trends, financial news
 */

const industryPublications = [
  // ===== BUSINESS & FINANCIAL NEWS =====
  {
    name: "Automotive News",
    website: "https://www.autonews.com",
    rssFeed: "https://www.autonews.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Business News", "Market Analysis", "Financial Reports", "Industry Trends"],
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
    specialties: ["Market Data", "Sales Reports", "Industry Analysis", "Business News"],
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
    specialties: ["Market Research", "Industry Analysis", "Business News", "Global Trends"],
    isActive: true
  },
  {
    name: "Automotive World",
    website: "https://www.automotiveworld.com",
    rssFeed: "https://www.automotiveworld.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Industry Analysis", "Technology Trends", "Market Research", "Business News"],
    isActive: true
  },
  {
    name: "Automotive Logistics",
    website: "https://www.automotivelogistics.media",
    rssFeed: "https://www.automotivelogistics.media/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Supply Chain",
    specialties: ["Supply Chain", "Logistics", "Manufacturing", "Industry Analysis"],
    isActive: true
  },

  // ===== TECHNOLOGY & INNOVATION =====
  {
    name: "Automotive News Europe",
    website: "https://europe.autonews.com",
    rssFeed: "https://europe.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["European Market", "Business News", "Industry Analysis", "Technology"],
    isActive: true
  },
  {
    name: "Automotive News China",
    website: "https://china.autonews.com",
    rssFeed: "https://china.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Chinese Market", "Business News", "Industry Analysis", "EV Market"],
    isActive: true
  },
  {
    name: "Automotive News Japan",
    website: "https://japan.autonews.com",
    rssFeed: "https://japan.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Japanese Market", "Business News", "Industry Analysis", "Technology"],
    isActive: true
  },

  // ===== SPECIALIZED INDUSTRY PUBLICATIONS =====
  {
    name: "Fleet Owner",
    website: "https://www.fleetowner.com",
    rssFeed: "https://www.fleetowner.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Fleet Management", "Commercial Vehicles", "Business Analysis", "Industry Trends"],
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
    specialties: ["Commercial Vehicles", "Fleet Management", "Business News", "Industry Analysis"],
    isActive: true
  },
  {
    name: "Trucking Info",
    website: "https://www.truckinginfo.com",
    rssFeed: "https://www.truckinginfo.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Trucking Industry", "Commercial Vehicles", "Business News", "Fleet Management"],
    isActive: true
  },
  {
    name: "Heavy Duty Trucking",
    website: "https://www.truckinginfo.com",
    rssFeed: "https://www.truckinginfo.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Commercial Vehicles",
    specialties: ["Heavy Duty Trucks", "Commercial Vehicles", "Business News", "Industry Analysis"],
    isActive: true
  },

  // ===== ELECTRIC VEHICLE INDUSTRY =====
  {
    name: "EV Magazine",
    website: "https://www.evmagazine.com",
    rssFeed: "https://www.evmagazine.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["EV Industry", "Battery Technology", "Charging Infrastructure", "Market Analysis"],
    isActive: true
  },
  {
    name: "Electric Vehicle News",
    website: "https://www.electricvehicle.com",
    rssFeed: "https://www.electricvehicle.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Electric Vehicles",
    specialties: ["EV News", "Technology", "Market Analysis", "Industry Trends"],
    isActive: true
  },
  {
    name: "Battery Technology",
    website: "https://www.batterytechnology.com",
    rssFeed: "https://www.batterytechnology.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Battery Technology",
    specialties: ["Battery Technology", "EV Batteries", "Energy Storage", "Technology"],
    isActive: true
  },

  // ===== AUTONOMOUS VEHICLES =====
  {
    name: "Autonomous Vehicle News",
    website: "https://www.autonomousvehiclenews.com",
    rssFeed: "https://www.autonomousvehiclenews.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Autonomous Vehicles",
    specialties: ["Autonomous Driving", "AI Technology", "Industry Analysis", "Technology"],
    isActive: true
  },
  {
    name: "Connected Car News",
    website: "https://www.connectedcarnews.com",
    rssFeed: "https://www.connectedcarnews.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Connected Vehicles",
    specialties: ["Connected Cars", "IoT", "Technology", "Industry Analysis"],
    isActive: true
  },

  // ===== MOTORSPORT INDUSTRY =====
  {
    name: "Motorsport Network",
    website: "https://www.motorsportnetwork.com",
    rssFeed: "https://www.motorsportnetwork.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Motorsport",
    specialties: ["Motorsport Industry", "Racing Business", "Technology", "Industry Analysis"],
    isActive: true
  },
  {
    name: "Racing Business",
    website: "https://www.racingbusiness.com",
    rssFeed: "https://www.racingbusiness.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Motorsport",
    specialties: ["Racing Business", "Motorsport Industry", "Financial News", "Industry Analysis"],
    isActive: true
  },

  // ===== AFTERMARKET & SERVICE =====
  {
    name: "Aftermarket News",
    website: "https://www.aftermarketnews.com",
    rssFeed: "https://www.aftermarketnews.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Aftermarket",
    specialties: ["Aftermarket Industry", "Parts & Service", "Business News", "Industry Analysis"],
    isActive: true
  },
  {
    name: "Automotive Service News",
    website: "https://www.automotiveservicenews.com",
    rssFeed: "https://www.automotiveservicenews.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "Service Industry",
    specialties: ["Service Industry", "Repair Business", "Technology", "Industry Analysis"],
    isActive: true
  },

  // ===== GLOBAL REGIONAL PUBLICATIONS =====
  {
    name: "Automotive News Europe",
    website: "https://europe.autonews.com",
    rssFeed: "https://europe.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["European Market", "Business News", "Industry Analysis", "Technology"],
    isActive: true
  },
  {
    name: "Automotive News China",
    website: "https://china.autonews.com",
    rssFeed: "https://china.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Chinese Market", "Business News", "Industry Analysis", "EV Market"],
    isActive: true
  },
  {
    name: "Automotive News Japan",
    website: "https://japan.autonews.com",
    rssFeed: "https://japan.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Japanese Market", "Business News", "Industry Analysis", "Technology"],
    isActive: true
  },
  {
    name: "Automotive News India",
    website: "https://india.autonews.com",
    rssFeed: "https://india.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "Industry Analysis",
    specialties: ["Indian Market", "Business News", "Industry Analysis", "Technology"],
    isActive: true
  },

  // ===== FINANCIAL & INVESTMENT =====
  {
    name: "Automotive Finance News",
    website: "https://www.automotivefinancenews.com",
    rssFeed: "https://www.automotivefinancenews.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Financial Services",
    specialties: ["Automotive Finance", "Investment News", "Business Analysis", "Financial Trends"],
    isActive: true
  },
  {
    name: "Automotive Investment News",
    website: "https://www.automotiveinvestmentnews.com",
    rssFeed: "https://www.automotiveinvestmentnews.com/rss/",
    region: "Global",
    language: "English",
    credibility: "High",
    automotiveFocus: "Investment",
    specialties: ["Investment News", "Financial Analysis", "Business News", "Market Trends"],
    isActive: true
  }
];

module.exports = industryPublications;
