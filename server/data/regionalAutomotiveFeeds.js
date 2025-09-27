/**
 * 🌍 REGIONAL AUTOMOTIVE NEWS FEEDS
 * Regional automotive news sources for comprehensive global coverage
 * Covers: Europe, Asia, Americas, Africa, Middle East, Oceania
 */

const regionalAutomotiveFeeds = [
  // ===== NORTH AMERICA =====
  {
    name: "Auto News Canada",
    website: "https://www.autonews.ca",
    rssFeed: "https://www.autonews.ca/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Canadian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Automotive News Mexico",
    website: "https://mexico.autonews.com",
    rssFeed: "https://mexico.autonews.com/rss/",
    region: "North America",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Mexican Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Brazil",
    website: "https://www.autonews.com.br",
    rssFeed: "https://www.autonews.com.br/rss/",
    region: "South America",
    language: "Portuguese",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Brazilian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },

  // ===== EUROPE =====
  {
    name: "Auto Express UK",
    website: "https://www.autoexpress.co.uk",
    rssFeed: "https://www.autoexpress.co.uk/feeds/all.rss",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["UK Market", "Car Reviews", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Bild Germany",
    website: "https://www.autobild.de",
    rssFeed: "https://www.autobild.de/rss/",
    region: "Europe",
    language: "German",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["German Market", "Car Reviews", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Motor und Sport Germany",
    website: "https://www.auto-motor-und-sport.de",
    rssFeed: "https://www.auto-motor-und-sport.de/rss/",
    region: "Europe",
    language: "German",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["German Market", "Performance Cars", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "L'Automobile France",
    website: "https://www.lautomobile.fr",
    rssFeed: "https://www.lautomobile.fr/rss/",
    region: "Europe",
    language: "French",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["French Market", "Car Reviews", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Express Italy",
    website: "https://www.autoexpress.it",
    rssFeed: "https://www.autoexpress.it/rss/",
    region: "Europe",
    language: "Italian",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Italian Market", "Ferrari", "Lamborghini", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Express Spain",
    website: "https://www.autoexpress.es",
    rssFeed: "https://www.autoexpress.es/rss/",
    region: "Europe",
    language: "Spanish",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Spanish Market", "Car Reviews", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Express Netherlands",
    website: "https://www.autoexpress.nl",
    rssFeed: "https://www.autoexpress.nl/rss/",
    region: "Europe",
    language: "Dutch",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Dutch Market", "Car Reviews", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Express Sweden",
    website: "https://www.autoexpress.se",
    rssFeed: "https://www.autoexpress.se/rss/",
    region: "Europe",
    language: "Swedish",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Swedish Market", "Volvo", "Saab", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto Express Norway",
    website: "https://www.autoexpress.no",
    rssFeed: "https://www.autoexpress.no/rss/",
    region: "Europe",
    language: "Norwegian",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Norwegian Market", "EV News", "Industry News", "Regional Coverage"],
    isActive: true
  },

  // ===== ASIA =====
  {
    name: "Auto News Japan",
    website: "https://japan.autonews.com",
    rssFeed: "https://japan.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Toyota", "Honda", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Response Japan",
    website: "https://response.jp",
    rssFeed: "https://response.jp/rss/",
    region: "Asia",
    language: "Japanese",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Technology", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Car Watch Japan",
    website: "https://car.watch.impress.co.jp",
    rssFeed: "https://car.watch.impress.co.jp/rss/",
    region: "Asia",
    language: "Japanese",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Japanese Market", "Technology", "Reviews", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News China",
    website: "https://china.autonews.com",
    rssFeed: "https://china.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Chinese Market", "EV News", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "China Daily Auto",
    website: "https://www.chinadaily.com.cn",
    rssFeed: "https://www.chinadaily.com.cn/rss/autonews.xml",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Chinese Market", "EV News", "Industry Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News India",
    website: "https://india.autonews.com",
    rssFeed: "https://india.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Indian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Korea",
    website: "https://korea.autonews.com",
    rssFeed: "https://korea.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Korean Market", "Hyundai", "Kia", "Regional Coverage"],
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
    specialties: ["Korean Market", "Hyundai", "Kia", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Thailand",
    website: "https://thailand.autonews.com",
    rssFeed: "https://thailand.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Thai Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Indonesia",
    website: "https://indonesia.autonews.com",
    rssFeed: "https://indonesia.autonews.com/rss/",
    region: "Asia",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Indonesian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },

  // ===== MIDDLE EAST =====
  {
    name: "Auto News Middle East",
    website: "https://middleeast.autonews.com",
    rssFeed: "https://middleeast.autonews.com/rss/",
    region: "Middle East",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Middle East Market", "Luxury Cars", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News UAE",
    website: "https://uae.autonews.com",
    rssFeed: "https://uae.autonews.com/rss/",
    region: "Middle East",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["UAE Market", "Luxury Cars", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Saudi Arabia",
    website: "https://saudi.autonews.com",
    rssFeed: "https://saudi.autonews.com/rss/",
    region: "Middle East",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Saudi Market", "Luxury Cars", "Industry News", "Regional Coverage"],
    isActive: true
  },

  // ===== AFRICA =====
  {
    name: "Auto News South Africa",
    website: "https://southafrica.autonews.com",
    rssFeed: "https://southafrica.autonews.com/rss/",
    region: "Africa",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["South African Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Nigeria",
    website: "https://nigeria.autonews.com",
    rssFeed: "https://nigeria.autonews.com/rss/",
    region: "Africa",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Nigerian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Egypt",
    website: "https://egypt.autonews.com",
    rssFeed: "https://egypt.autonews.com/rss/",
    region: "Africa",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Egyptian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },

  // ===== OCEANIA =====
  {
    name: "Auto News Australia",
    website: "https://australia.autonews.com",
    rssFeed: "https://australia.autonews.com/rss/",
    region: "Oceania",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Australian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News New Zealand",
    website: "https://newzealand.autonews.com",
    rssFeed: "https://newzealand.autonews.com/rss/",
    region: "Oceania",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["New Zealand Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },

  // ===== SPECIALIZED REGIONAL SOURCES =====
  {
    name: "Auto News Russia",
    website: "https://russia.autonews.com",
    rssFeed: "https://russia.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Russian Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Turkey",
    website: "https://turkey.autonews.com",
    rssFeed: "https://turkey.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Turkish Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Poland",
    website: "https://poland.autonews.com",
    rssFeed: "https://poland.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Polish Market", "Industry News", "Business Analysis", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Czech Republic",
    website: "https://czech.autonews.com",
    rssFeed: "https://czech.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Czech Market", "Skoda", "Industry News", "Regional Coverage"],
    isActive: true
  },
  {
    name: "Auto News Romania",
    website: "https://romania.autonews.com",
    rssFeed: "https://romania.autonews.com/rss/",
    region: "Europe",
    language: "English",
    credibility: "High",
    automotiveFocus: "General Automotive",
    specialties: ["Romanian Market", "Dacia", "Industry News", "Regional Coverage"],
    isActive: true
  }
];

module.exports = regionalAutomotiveFeeds;
