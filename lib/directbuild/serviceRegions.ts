import type { AustralianState, ServiceRegion } from "./geoTypes";

export const AUSTRALIAN_STATES: AustralianState[] = [
  "NSW",
  "VIC",
  "QLD",
  "ACT",
  "SA",
  "WA",
  "TAS",
  "NT",
];

type RegionSeed = {
  label: string;
  state: AustralianState;
  metro?: string;
  regionType?: ServiceRegion["regionType"];
  aliases?: string[];
  exampleAreas?: string[];
  lgas?: string[];
  defaultCompetitorSearchArea?: string;
  regionFitNote?: string;
  intakeStatus?: ServiceRegion["intakeStatus"];
  absNotes?: string;
};

const METRO_NOTE =
  "A concentrated metro region where response speed, reviews, quote follow-up, and booked-job tracking matter before scaling ad spend.";
const VALUE_NOTE =
  "A higher-value residential market where DirectBuild should first validate enquiry quality and quote conversion before increasing campaign spend.";
const REGIONAL_NOTE =
  "A broad regional market where campaign radius, travel time, and response capacity should be reviewed before activation.";
const REMOTE_NOTE =
  "A remote or dispersed market where DirectBuild should review travel time, service radius, and job economics before activation.";

const seeds: RegionSeed[] = [
  { label: "Sydney - Northern Beaches", state: "NSW", metro: "Sydney", aliases: ["Northern Beaches", "Manly", "Dee Why"], exampleAreas: ["Manly", "Brookvale", "Dee Why"], lgas: ["Northern Beaches"], regionFitNote: VALUE_NOTE },
  { label: "Sydney - North Shore", state: "NSW", metro: "Sydney", aliases: ["North Shore", "Lower North Shore", "Upper North Shore"], exampleAreas: ["Chatswood", "Mosman", "Hornsby"], lgas: ["Ku-ring-gai", "Willoughby", "North Sydney", "Mosman", "Lane Cove", "Hornsby"], regionFitNote: VALUE_NOTE },
  { label: "Sydney - Inner West", state: "NSW", metro: "Sydney", aliases: ["Inner West Sydney"], exampleAreas: ["Marrickville", "Leichhardt", "Ashfield"], lgas: ["Inner West"], regionFitNote: METRO_NOTE },
  { label: "Sydney - Eastern Suburbs", state: "NSW", metro: "Sydney", aliases: ["Eastern Suburbs"], exampleAreas: ["Bondi", "Randwick", "Maroubra"], lgas: ["Waverley", "Randwick", "Woollahra"], regionFitNote: VALUE_NOTE },
  { label: "Sydney - CBD / City Fringe", state: "NSW", metro: "Sydney", aliases: ["Sydney CBD", "City Fringe"], exampleAreas: ["Sydney", "Surry Hills", "Redfern"], lgas: ["City of Sydney"], regionFitNote: METRO_NOTE },
  { label: "Sydney - Hills District", state: "NSW", metro: "Sydney", aliases: ["Hills District", "The Hills"], exampleAreas: ["Castle Hill", "Kellyville", "Baulkham Hills"], lgas: ["The Hills Shire"], regionFitNote: VALUE_NOTE },
  { label: "Sydney - Parramatta / Greater West", state: "NSW", metro: "Sydney", aliases: ["Parramatta", "Greater West"], exampleAreas: ["Parramatta", "Westmead", "Greystanes"], lgas: ["City of Parramatta", "Cumberland"], regionFitNote: METRO_NOTE },
  { label: "Sydney - Western Sydney", state: "NSW", metro: "Sydney", aliases: ["Western Sydney", "Penrith", "Blacktown"], exampleAreas: ["Penrith", "Blacktown", "Mount Druitt"], lgas: ["Penrith", "Blacktown"], regionFitNote: METRO_NOTE },
  { label: "Sydney - South West", state: "NSW", metro: "Sydney", aliases: ["South West Sydney"], exampleAreas: ["Liverpool", "Fairfield", "Bankstown"], lgas: ["Liverpool", "Fairfield", "Canterbury-Bankstown"], regionFitNote: METRO_NOTE },
  { label: "Sydney - Macarthur / Campbelltown", state: "NSW", metro: "Sydney", aliases: ["Macarthur", "Campbelltown"], exampleAreas: ["Campbelltown", "Camden", "Narellan"], lgas: ["Campbelltown", "Camden"], regionFitNote: METRO_NOTE },
  { label: "Sydney - Sutherland Shire", state: "NSW", metro: "Sydney", aliases: ["Sutherland Shire", "The Shire"], exampleAreas: ["Sutherland", "Cronulla", "Miranda"], lgas: ["Sutherland Shire"], regionFitNote: VALUE_NOTE },
  { label: "Sydney - St George / Canterbury-Bankstown", state: "NSW", metro: "Sydney", aliases: ["St George", "Canterbury Bankstown"], exampleAreas: ["Hurstville", "Kogarah", "Bankstown"], lgas: ["Georges River", "Bayside", "Canterbury-Bankstown"], regionFitNote: METRO_NOTE },
  { label: "Central Coast", state: "NSW", regionType: "regional_area", aliases: ["Gosford", "Wyong"], exampleAreas: ["Gosford", "Terrigal", "Wyong"], lgas: ["Central Coast"], regionFitNote: REGIONAL_NOTE },
  { label: "Newcastle / Lake Macquarie", state: "NSW", regionType: "regional_city", aliases: ["Newcastle", "Lake Macquarie"], exampleAreas: ["Newcastle", "Charlestown", "Belmont"], lgas: ["Newcastle", "Lake Macquarie"], regionFitNote: REGIONAL_NOTE },
  { label: "Hunter Valley", state: "NSW", regionType: "regional_area", aliases: ["Hunter", "Maitland", "Cessnock"], exampleAreas: ["Maitland", "Cessnock", "Singleton"], lgas: ["Maitland", "Cessnock", "Singleton", "Muswellbrook"], regionFitNote: REGIONAL_NOTE },
  { label: "Wollongong / Illawarra", state: "NSW", regionType: "regional_city", aliases: ["Wollongong", "Illawarra"], exampleAreas: ["Wollongong", "Shellharbour", "Kiama"], lgas: ["Wollongong", "Shellharbour", "Kiama"], regionFitNote: REGIONAL_NOTE },
  { label: "Southern Highlands", state: "NSW", regionType: "regional_area", aliases: ["Bowral", "Mittagong"], exampleAreas: ["Bowral", "Mittagong", "Moss Vale"], lgas: ["Wingecarribee"], regionFitNote: VALUE_NOTE },
  { label: "Blue Mountains", state: "NSW", regionType: "regional_area", aliases: ["Katoomba", "Springwood"], exampleAreas: ["Katoomba", "Leura", "Springwood"], lgas: ["Blue Mountains"], regionFitNote: REGIONAL_NOTE },
  { label: "Central West NSW", state: "NSW", regionType: "regional_area", aliases: ["Central West", "Orange", "Bathurst"], exampleAreas: ["Orange", "Bathurst", "Lithgow"], regionFitNote: REGIONAL_NOTE },
  { label: "Mid North Coast", state: "NSW", regionType: "regional_area", aliases: ["Port Macquarie", "Taree"], exampleAreas: ["Port Macquarie", "Taree", "Kempsey"], regionFitNote: REGIONAL_NOTE },
  { label: "Northern Rivers", state: "NSW", regionType: "regional_area", aliases: ["Byron", "Lismore", "Ballina"], exampleAreas: ["Byron Bay", "Lismore", "Ballina"], regionFitNote: VALUE_NOTE },
  { label: "Coffs Harbour / Clarence", state: "NSW", regionType: "regional_area", aliases: ["Coffs Harbour", "Clarence Valley"], exampleAreas: ["Coffs Harbour", "Grafton", "Yamba"], regionFitNote: REGIONAL_NOTE },
  { label: "New England / North West NSW", state: "NSW", regionType: "regional_area", aliases: ["New England", "Tamworth", "Armidale"], exampleAreas: ["Tamworth", "Armidale", "Moree"], regionFitNote: REGIONAL_NOTE },
  { label: "Riverina", state: "NSW", regionType: "regional_area", aliases: ["Wagga Wagga", "Griffith"], exampleAreas: ["Wagga Wagga", "Griffith", "Leeton"], regionFitNote: REGIONAL_NOTE },
  { label: "Murray NSW", state: "NSW", regionType: "regional_area", aliases: ["Albury", "Murray"], exampleAreas: ["Albury", "Moama", "Deniliquin"], regionFitNote: REGIONAL_NOTE },
  { label: "South Coast NSW", state: "NSW", regionType: "regional_area", aliases: ["Shoalhaven", "Batemans Bay"], exampleAreas: ["Nowra", "Ulladulla", "Batemans Bay"], regionFitNote: REGIONAL_NOTE },
  { label: "Snowy Mountains / Monaro", state: "NSW", regionType: "regional_area", aliases: ["Snowy Mountains", "Monaro"], exampleAreas: ["Cooma", "Jindabyne", "Berridale"], regionFitNote: REGIONAL_NOTE },
  { label: "Canberra / Queanbeyan", state: "NSW", regionType: "cross_border_region", aliases: ["Queanbeyan", "Canberra region"], exampleAreas: ["Queanbeyan", "Jerrabomberra", "Canberra"], lgas: ["Queanbeyan-Palerang", "ACT"], regionFitNote: REGIONAL_NOTE },

  { label: "Melbourne - CBD / Inner", state: "VIC", metro: "Melbourne", aliases: ["Melbourne CBD", "Inner Melbourne"], exampleAreas: ["Melbourne", "Southbank", "Richmond"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - Inner North", state: "VIC", metro: "Melbourne", aliases: ["Inner North Melbourne"], exampleAreas: ["Brunswick", "Northcote", "Fitzroy"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - Inner South", state: "VIC", metro: "Melbourne", aliases: ["Inner South Melbourne"], exampleAreas: ["Prahran", "St Kilda", "South Yarra"], regionFitNote: VALUE_NOTE },
  { label: "Melbourne - Eastern Suburbs", state: "VIC", metro: "Melbourne", aliases: ["Eastern Melbourne"], exampleAreas: ["Box Hill", "Doncaster", "Ringwood"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - South East", state: "VIC", metro: "Melbourne", aliases: ["South East Melbourne"], exampleAreas: ["Dandenong", "Narre Warren", "Cranbourne"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - Bayside", state: "VIC", metro: "Melbourne", aliases: ["Bayside Melbourne"], exampleAreas: ["Brighton", "Sandringham", "Hampton"], regionFitNote: VALUE_NOTE },
  { label: "Melbourne - Northern Suburbs", state: "VIC", metro: "Melbourne", aliases: ["Northern Melbourne"], exampleAreas: ["Preston", "Reservoir", "Epping"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - Western Suburbs", state: "VIC", metro: "Melbourne", aliases: ["Western Melbourne"], exampleAreas: ["Footscray", "Werribee", "Point Cook"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - North West", state: "VIC", metro: "Melbourne", aliases: ["North West Melbourne"], exampleAreas: ["Sunbury", "Tullamarine", "Craigieburn"], regionFitNote: METRO_NOTE },
  { label: "Melbourne - Mornington Peninsula", state: "VIC", metro: "Melbourne", aliases: ["Mornington Peninsula"], exampleAreas: ["Mornington", "Frankston", "Rosebud"], regionFitNote: VALUE_NOTE },
  { label: "Geelong / Surf Coast", state: "VIC", regionType: "regional_city", aliases: ["Geelong", "Surf Coast"], exampleAreas: ["Geelong", "Torquay", "Ocean Grove"], regionFitNote: REGIONAL_NOTE },
  { label: "Ballarat / Central Highlands", state: "VIC", regionType: "regional_city", aliases: ["Ballarat", "Central Highlands"], exampleAreas: ["Ballarat", "Bacchus Marsh", "Daylesford"], regionFitNote: REGIONAL_NOTE },
  { label: "Bendigo / Loddon", state: "VIC", regionType: "regional_city", aliases: ["Bendigo", "Loddon"], exampleAreas: ["Bendigo", "Castlemaine", "Kyneton"], regionFitNote: REGIONAL_NOTE },
  { label: "Shepparton / Goulburn Valley", state: "VIC", regionType: "regional_city", aliases: ["Shepparton", "Goulburn Valley"], exampleAreas: ["Shepparton", "Mooroopna", "Echuca"], regionFitNote: REGIONAL_NOTE },
  { label: "Latrobe Valley / Gippsland", state: "VIC", regionType: "regional_area", aliases: ["Gippsland", "Latrobe Valley"], exampleAreas: ["Traralgon", "Morwell", "Warragul"], regionFitNote: REGIONAL_NOTE },
  { label: "Warrnambool / South West Coast", state: "VIC", regionType: "regional_area", aliases: ["Warrnambool", "South West Coast"], exampleAreas: ["Warrnambool", "Port Fairy", "Hamilton"], regionFitNote: REGIONAL_NOTE },
  { label: "Mildura / Sunraysia", state: "VIC", regionType: "regional_city", aliases: ["Mildura", "Sunraysia"], exampleAreas: ["Mildura", "Red Cliffs", "Merbein"], regionFitNote: REGIONAL_NOTE },
  { label: "Wodonga / North East VIC", state: "VIC", regionType: "cross_border_region", aliases: ["Wodonga", "North East Victoria"], exampleAreas: ["Wodonga", "Wangaratta", "Beechworth"], regionFitNote: REGIONAL_NOTE },

  { label: "Brisbane - CBD / Inner", state: "QLD", metro: "Brisbane", aliases: ["Brisbane CBD", "Inner Brisbane"], exampleAreas: ["Brisbane", "Fortitude Valley", "New Farm"], regionFitNote: METRO_NOTE },
  { label: "Brisbane - Northside", state: "QLD", metro: "Brisbane", aliases: ["North Brisbane"], exampleAreas: ["Chermside", "Nundah", "Aspley"], regionFitNote: METRO_NOTE },
  { label: "Brisbane - Southside", state: "QLD", metro: "Brisbane", aliases: ["South Brisbane"], exampleAreas: ["Carindale", "Sunnybank", "Mount Gravatt"], regionFitNote: METRO_NOTE },
  { label: "Brisbane - East / Bayside", state: "QLD", metro: "Brisbane", aliases: ["Brisbane Bayside"], exampleAreas: ["Wynnum", "Manly", "Cleveland"], regionFitNote: VALUE_NOTE },
  { label: "Brisbane - West", state: "QLD", metro: "Brisbane", aliases: ["Western Brisbane"], exampleAreas: ["Indooroopilly", "The Gap", "Kenmore"], regionFitNote: VALUE_NOTE },
  { label: "Logan", state: "QLD", metro: "Brisbane", aliases: ["Logan City"], exampleAreas: ["Logan", "Springwood", "Beenleigh"], regionFitNote: METRO_NOTE },
  { label: "Moreton Bay", state: "QLD", metro: "Brisbane", aliases: ["Moreton Bay Region"], exampleAreas: ["North Lakes", "Redcliffe", "Caboolture"], regionFitNote: METRO_NOTE },
  { label: "Ipswich", state: "QLD", regionType: "regional_city", aliases: ["Ipswich QLD"], exampleAreas: ["Ipswich", "Springfield", "Ripley"], regionFitNote: REGIONAL_NOTE },
  { label: "Gold Coast", state: "QLD", regionType: "regional_city", aliases: ["Gold Coast QLD"], exampleAreas: ["Southport", "Robina", "Burleigh Heads"], regionFitNote: VALUE_NOTE },
  { label: "Sunshine Coast", state: "QLD", regionType: "regional_city", aliases: ["Sunshine Coast QLD"], exampleAreas: ["Maroochydore", "Noosa", "Caloundra"], regionFitNote: VALUE_NOTE },
  { label: "Toowoomba / Darling Downs", state: "QLD", regionType: "regional_city", aliases: ["Toowoomba", "Darling Downs"], exampleAreas: ["Toowoomba", "Highfields", "Warwick"], regionFitNote: REGIONAL_NOTE },
  { label: "Townsville", state: "QLD", regionType: "regional_city", aliases: ["Townsville QLD"], exampleAreas: ["Townsville", "Kirwan", "Aitkenvale"], regionFitNote: REGIONAL_NOTE },
  { label: "Cairns", state: "QLD", regionType: "regional_city", aliases: ["Cairns QLD"], exampleAreas: ["Cairns", "Smithfield", "Edmonton"], regionFitNote: REGIONAL_NOTE },
  { label: "Mackay", state: "QLD", regionType: "regional_city", aliases: ["Mackay QLD"], exampleAreas: ["Mackay", "Andergrove", "Sarina"], regionFitNote: REGIONAL_NOTE },
  { label: "Rockhampton", state: "QLD", regionType: "regional_city", aliases: ["Rockhampton QLD"], exampleAreas: ["Rockhampton", "Yeppoon", "Gracemere"], regionFitNote: REGIONAL_NOTE },
  { label: "Bundaberg / Wide Bay", state: "QLD", regionType: "regional_area", aliases: ["Bundaberg", "Wide Bay"], exampleAreas: ["Bundaberg", "Childers", "Maryborough"], regionFitNote: REGIONAL_NOTE },
  { label: "Fraser Coast / Hervey Bay", state: "QLD", regionType: "regional_area", aliases: ["Fraser Coast", "Hervey Bay"], exampleAreas: ["Hervey Bay", "Maryborough", "Urangan"], regionFitNote: REGIONAL_NOTE },
  { label: "Gladstone", state: "QLD", regionType: "regional_city", aliases: ["Gladstone QLD"], exampleAreas: ["Gladstone", "Tannum Sands", "Calliope"], regionFitNote: REGIONAL_NOTE },
  { label: "Gympie", state: "QLD", regionType: "regional_area", aliases: ["Gympie QLD"], exampleAreas: ["Gympie", "Kandanga", "Tin Can Bay"], regionFitNote: REGIONAL_NOTE },
  { label: "Whitsundays", state: "QLD", regionType: "regional_area", aliases: ["Whitsunday", "Airlie Beach"], exampleAreas: ["Airlie Beach", "Cannonvale", "Proserpine"], regionFitNote: REGIONAL_NOTE },
  { label: "Mount Isa / North West QLD", state: "QLD", regionType: "regional_area", aliases: ["Mount Isa", "North West Queensland"], exampleAreas: ["Mount Isa", "Cloncurry", "Julia Creek"], regionFitNote: REMOTE_NOTE },

  { label: "Perth - CBD / Inner", state: "WA", metro: "Perth", aliases: ["Perth CBD", "Inner Perth"], exampleAreas: ["Perth", "Subiaco", "Victoria Park"], regionFitNote: METRO_NOTE },
  { label: "Perth - Northern Suburbs", state: "WA", metro: "Perth", aliases: ["North Perth"], exampleAreas: ["Joondalup", "Wanneroo", "Balcatta"], regionFitNote: METRO_NOTE },
  { label: "Perth - Southern Suburbs", state: "WA", metro: "Perth", aliases: ["South Perth"], exampleAreas: ["Canning Vale", "Armadale", "Cockburn"], regionFitNote: METRO_NOTE },
  { label: "Perth - Eastern Suburbs", state: "WA", metro: "Perth", aliases: ["East Perth"], exampleAreas: ["Midland", "Guildford", "Kalamunda"], regionFitNote: METRO_NOTE },
  { label: "Perth - Western Suburbs", state: "WA", metro: "Perth", aliases: ["Western Suburbs Perth"], exampleAreas: ["Claremont", "Nedlands", "Cottesloe"], regionFitNote: VALUE_NOTE },
  { label: "Fremantle / Coastal", state: "WA", metro: "Perth", aliases: ["Fremantle", "Perth Coastal"], exampleAreas: ["Fremantle", "Scarborough", "Cottesloe"], regionFitNote: VALUE_NOTE },
  { label: "Mandurah / Peel", state: "WA", regionType: "regional_city", aliases: ["Mandurah", "Peel"], exampleAreas: ["Mandurah", "Pinjarra", "Rockingham"], regionFitNote: REGIONAL_NOTE },
  { label: "Bunbury / South West", state: "WA", regionType: "regional_city", aliases: ["Bunbury", "South West WA"], exampleAreas: ["Bunbury", "Australind", "Collie"], regionFitNote: REGIONAL_NOTE },
  { label: "Busselton / Margaret River", state: "WA", regionType: "regional_area", aliases: ["Busselton", "Margaret River"], exampleAreas: ["Busselton", "Dunsborough", "Margaret River"], regionFitNote: VALUE_NOTE },
  { label: "Albany / Great Southern", state: "WA", regionType: "regional_area", aliases: ["Albany", "Great Southern"], exampleAreas: ["Albany", "Denmark", "Mount Barker"], regionFitNote: REGIONAL_NOTE },
  { label: "Geraldton / Mid West", state: "WA", regionType: "regional_area", aliases: ["Geraldton", "Mid West WA"], exampleAreas: ["Geraldton", "Dongara", "Northampton"], regionFitNote: REGIONAL_NOTE },
  { label: "Kalgoorlie / Goldfields", state: "WA", regionType: "regional_area", aliases: ["Kalgoorlie", "Goldfields"], exampleAreas: ["Kalgoorlie", "Boulder", "Coolgardie"], regionFitNote: REMOTE_NOTE },
  { label: "Broome / Kimberley", state: "WA", regionType: "regional_area", aliases: ["Broome", "Kimberley"], exampleAreas: ["Broome", "Derby", "Kununurra"], regionFitNote: REMOTE_NOTE },
  { label: "Pilbara", state: "WA", regionType: "regional_area", aliases: ["Karratha", "Port Hedland"], exampleAreas: ["Karratha", "Port Hedland", "Newman"], regionFitNote: REMOTE_NOTE },
  { label: "Esperance", state: "WA", regionType: "regional_area", aliases: ["Esperance WA"], exampleAreas: ["Esperance", "Castletown", "Norseman"], regionFitNote: REGIONAL_NOTE },

  { label: "Adelaide - CBD / Inner", state: "SA", metro: "Adelaide", aliases: ["Adelaide CBD", "Inner Adelaide"], exampleAreas: ["Adelaide", "Norwood", "Unley"], regionFitNote: METRO_NOTE },
  { label: "Adelaide - North", state: "SA", metro: "Adelaide", aliases: ["Northern Adelaide"], exampleAreas: ["Salisbury", "Elizabeth", "Gawler"], regionFitNote: METRO_NOTE },
  { label: "Adelaide - South", state: "SA", metro: "Adelaide", aliases: ["Southern Adelaide"], exampleAreas: ["Noarlunga", "Morphett Vale", "Aberfoyle Park"], regionFitNote: METRO_NOTE },
  { label: "Adelaide - East", state: "SA", metro: "Adelaide", aliases: ["Eastern Adelaide"], exampleAreas: ["Burnside", "Norwood", "Campbelltown"], regionFitNote: VALUE_NOTE },
  { label: "Adelaide - West / Coastal", state: "SA", metro: "Adelaide", aliases: ["Western Adelaide", "Coastal Adelaide"], exampleAreas: ["Glenelg", "Henley Beach", "Semaphore"], regionFitNote: VALUE_NOTE },
  { label: "Adelaide Hills", state: "SA", regionType: "regional_area", aliases: ["Mount Barker", "Hahndorf"], exampleAreas: ["Mount Barker", "Hahndorf", "Stirling"], regionFitNote: VALUE_NOTE },
  { label: "Barossa Valley", state: "SA", regionType: "regional_area", aliases: ["Barossa"], exampleAreas: ["Nuriootpa", "Tanunda", "Angaston"], regionFitNote: REGIONAL_NOTE },
  { label: "Fleurieu Peninsula", state: "SA", regionType: "regional_area", aliases: ["Fleurieu"], exampleAreas: ["Victor Harbor", "Goolwa", "McLaren Vale"], regionFitNote: REGIONAL_NOTE },
  { label: "Limestone Coast", state: "SA", regionType: "regional_area", aliases: ["Mount Gambier"], exampleAreas: ["Mount Gambier", "Naracoorte", "Robe"], regionFitNote: REGIONAL_NOTE },
  { label: "Riverland", state: "SA", regionType: "regional_area", aliases: ["Renmark", "Berri"], exampleAreas: ["Renmark", "Berri", "Loxton"], regionFitNote: REGIONAL_NOTE },
  { label: "Yorke Peninsula", state: "SA", regionType: "regional_area", aliases: ["Yorke"], exampleAreas: ["Kadina", "Moonta", "Maitland"], regionFitNote: REGIONAL_NOTE },
  { label: "Eyre Peninsula", state: "SA", regionType: "regional_area", aliases: ["Eyre"], exampleAreas: ["Port Lincoln", "Whyalla", "Ceduna"], regionFitNote: REGIONAL_NOTE },
  { label: "Whyalla / Port Augusta", state: "SA", regionType: "regional_area", aliases: ["Whyalla", "Port Augusta"], exampleAreas: ["Whyalla", "Port Augusta", "Port Pirie"], regionFitNote: REGIONAL_NOTE },
  { label: "Murraylands", state: "SA", regionType: "regional_area", aliases: ["Murray Bridge"], exampleAreas: ["Murray Bridge", "Mannum", "Tailem Bend"], regionFitNote: REGIONAL_NOTE },

  { label: "Hobart", state: "TAS", regionType: "regional_city", aliases: ["Greater Hobart"], exampleAreas: ["Hobart", "Glenorchy", "Kingston"], regionFitNote: REGIONAL_NOTE },
  { label: "Launceston", state: "TAS", regionType: "regional_city", aliases: ["Launceston TAS"], exampleAreas: ["Launceston", "Riverside", "Kings Meadows"], regionFitNote: REGIONAL_NOTE },
  { label: "Devonport / Burnie / North West", state: "TAS", regionType: "regional_area", aliases: ["Devonport", "Burnie", "North West Tasmania"], exampleAreas: ["Devonport", "Burnie", "Ulverstone"], regionFitNote: REGIONAL_NOTE },
  { label: "East Coast Tasmania", state: "TAS", regionType: "regional_area", aliases: ["East Coast TAS"], exampleAreas: ["St Helens", "Bicheno", "Swansea"], regionFitNote: REGIONAL_NOTE },
  { label: "Southern Tasmania", state: "TAS", regionType: "regional_area", aliases: ["South Tasmania"], exampleAreas: ["Huonville", "New Norfolk", "Cygnet"], regionFitNote: REGIONAL_NOTE },
  { label: "Northern Tasmania", state: "TAS", regionType: "regional_area", aliases: ["North Tasmania"], exampleAreas: ["Scottsdale", "Deloraine", "George Town"], regionFitNote: REGIONAL_NOTE },

  { label: "Canberra - Inner North / Inner South", state: "ACT", metro: "Canberra", aliases: ["Inner Canberra"], exampleAreas: ["Braddon", "Kingston", "Griffith"], regionFitNote: VALUE_NOTE },
  { label: "Canberra - Belconnen", state: "ACT", metro: "Canberra", aliases: ["Belconnen"], exampleAreas: ["Belconnen", "Bruce", "Macquarie"], regionFitNote: METRO_NOTE },
  { label: "Canberra - Gungahlin", state: "ACT", metro: "Canberra", aliases: ["Gungahlin"], exampleAreas: ["Gungahlin", "Amaroo", "Nicholls"], regionFitNote: METRO_NOTE },
  { label: "Canberra - Woden / Weston Creek", state: "ACT", metro: "Canberra", aliases: ["Woden", "Weston Creek"], exampleAreas: ["Woden", "Curtin", "Weston"], regionFitNote: METRO_NOTE },
  { label: "Canberra - Tuggeranong", state: "ACT", metro: "Canberra", aliases: ["Tuggeranong"], exampleAreas: ["Tuggeranong", "Kambah", "Calwell"], regionFitNote: METRO_NOTE },
  { label: "Canberra - Molonglo", state: "ACT", metro: "Canberra", aliases: ["Molonglo"], exampleAreas: ["Coombs", "Wright", "Denman Prospect"], regionFitNote: METRO_NOTE },
  { label: "Canberra / Queanbeyan", state: "ACT", regionType: "cross_border_region", aliases: ["Queanbeyan", "Canberra region"], exampleAreas: ["Canberra", "Queanbeyan", "Jerrabomberra"], regionFitNote: REGIONAL_NOTE },

  { label: "Darwin / Palmerston", state: "NT", regionType: "regional_city", aliases: ["Darwin", "Palmerston"], exampleAreas: ["Darwin", "Palmerston", "Casuarina"], regionFitNote: REGIONAL_NOTE },
  { label: "Alice Springs", state: "NT", regionType: "regional_city", aliases: ["Alice Springs NT"], exampleAreas: ["Alice Springs", "Larapinta", "East Side"], regionFitNote: REMOTE_NOTE },
  { label: "Katherine", state: "NT", regionType: "regional_area", aliases: ["Katherine NT"], exampleAreas: ["Katherine", "Tindal", "Mataranka"], regionFitNote: REMOTE_NOTE },
  { label: "Tennant Creek / Barkly", state: "NT", regionType: "regional_area", aliases: ["Tennant Creek", "Barkly"], exampleAreas: ["Tennant Creek", "Barkly", "Elliott"], regionFitNote: REMOTE_NOTE },
  { label: "Nhulunbuy / East Arnhem", state: "NT", regionType: "regional_area", aliases: ["Nhulunbuy", "East Arnhem"], exampleAreas: ["Nhulunbuy", "Yirrkala", "Gove"], regionFitNote: REMOTE_NOTE },
  { label: "Regional / Remote NT", state: "NT", regionType: "statewide_remote", aliases: ["Remote NT", "Regional NT"], exampleAreas: ["Jabiru", "Maningrida", "Yuendumu"], regionFitNote: REMOTE_NOTE, intakeStatus: "reviewing" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

// DirectBuild service regions are commercial service-market groupings, not
// official legal, council, or ABS statistical boundaries. Future ABS ASGS work
// should map these region ids to SAL/LGA/SA3/SA4 codes instead of replacing the
// commercial intake model.
export const SERVICE_REGIONS: ServiceRegion[] = seeds.map((seed) => ({
  id: `${seed.state.toLowerCase()}-${slugify(seed.label)}`,
  label: seed.label,
  state: seed.state,
  metro: seed.metro,
  regionType:
    seed.regionType || (seed.metro ? "capital_metro_cluster" : "regional_area"),
  aliases: Array.from(new Set([seed.label, ...(seed.aliases || [])])),
  exampleAreas: seed.exampleAreas || [],
  lgas: seed.lgas,
  absReference: {
    gccsa: seed.metro,
    notes:
      seed.absNotes ||
      "Commercial DirectBuild service region. Map to official ABS ASGS geography in a later import.",
  },
  defaultCompetitorSearchArea:
    seed.defaultCompetitorSearchArea ||
    `${seed.exampleAreas?.[0] || seed.label}, ${seed.state}, Australia`,
  regionFitNote: seed.regionFitNote || REGIONAL_NOTE,
  intakeStatus: seed.intakeStatus || "open",
}));

export function getServiceRegionById(id: string) {
  return SERVICE_REGIONS.find((region) => region.id === id);
}

export function getServiceRegionsByIds(ids: string[]) {
  const idSet = new Set(ids);
  return SERVICE_REGIONS.filter((region) => idSet.has(region.id));
}

export function getServiceRegionsByState(state: AustralianState) {
  return SERVICE_REGIONS.filter((region) => region.state === state);
}

export function getOpenServiceRegions() {
  return SERVICE_REGIONS.filter((region) => region.intakeStatus === "open");
}

export function findServiceRegionByLabelOrAlias(value: string) {
  const needle = normalise(value);
  if (!needle) return undefined;

  return SERVICE_REGIONS.find((region) =>
    region.aliases.some((alias) => normalise(alias) === needle),
  );
}

export function normaliseServiceRegionInput(value: string) {
  return findServiceRegionByLabelOrAlias(value)?.label || value.trim();
}

export function groupServiceRegionsByState() {
  return AUSTRALIAN_STATES.reduce(
    (groups, state) => {
      groups[state] = getServiceRegionsByState(state);
      return groups;
    },
    {} as Record<AustralianState, ServiceRegion[]>,
  );
}
