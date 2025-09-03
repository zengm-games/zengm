export const realContinents = [
	"North America",
	"Africa",
	"Asia",
	"Australia",
	"Europe",
	"South America",
	"Antarctica",
] as const;
export const continents = [...realContinents, "Unknown"] as const;
export type Continent = (typeof continents)[number];

const geographicCoordinates: Record<
	string,
	{
		latitude: number;
		longitude: number;
		continent: Continent;
	}
> = {
	Albuquerque: {
		continent: "North America",
		latitude: 35.0844,
		longitude: -106.6504,
	},
	Anchorage: {
		continent: "North America",
		latitude: 61.2175,
		longitude: -149.8978,
	},
	Anderson: {
		continent: "North America",
		latitude: 40.1053,
		longitude: -85.6803,
	},
	Atlanta: {
		continent: "North America",
		latitude: 33.7489954,
		longitude: -84.3879824,
	},
	Austin: {
		continent: "North America",
		latitude: 30.267153,
		longitude: -97.7430608,
	},
	Baltimore: {
		continent: "North America",
		latitude: 39.2903848,
		longitude: -76.6121893,
	},
	Beijing: {
		continent: "Asia",
		latitude: 39.9042,
		longitude: 116.4074,
	},
	Boston: {
		continent: "North America",
		latitude: 42.3600825,
		longitude: -71.0588801,
	},
	Buffalo: {
		continent: "North America",
		latitude: 42.8864468,
		longitude: -78.8783689,
	},
	Brooklyn: {
		continent: "North America",
		latitude: 40.6781784,
		longitude: -73.9441579,
	},
	Calgary: {
		continent: "North America",
		latitude: 51.0447331,
		longitude: -114.0718831,
	},
	Charlotte: {
		continent: "North America",
		latitude: 35.2270869,
		longitude: -80.8431267,
	},
	Chicago: {
		continent: "North America",
		latitude: 41.8781136,
		longitude: -87.6297982,
	},
	Cincinnati: {
		continent: "North America",
		latitude: 39.1031182,
		longitude: -84.5120196,
	},
	Cleveland: {
		continent: "North America",
		latitude: 41.49932,
		longitude: -81.6943605,
	},
	Dallas: {
		continent: "North America",
		latitude: 32.7766642,
		longitude: -96.7969879,
	},
	Denver: {
		continent: "North America",
		latitude: 39.7392358,
		longitude: -104.990251,
	},
	Detroit: {
		continent: "North America",
		latitude: 42.331427,
		longitude: -83.0457538,
	},
	Edmonton: {
		continent: "North America",
		latitude: 53.5461,
		longitude: -113.4937,
	},
	"Fort Wayne": {
		continent: "North America",
		latitude: 41.0793,
		longitude: -85.1394,
	},
	"Golden State": {
		continent: "North America",
		latitude: 37.7749295,
		longitude: -122.4194155,
	},
	Hawaii: {
		continent: "North America",
		latitude: 19.8967662,
		longitude: -155.5827818,
	},
	Houston: {
		continent: "North America",
		latitude: 29.7604267,
		longitude: -95.3698028,
	},
	Indiana: {
		continent: "North America",
		latitude: 39.768403,
		longitude: -86.158068,
	},
	Indianapolis: {
		continent: "North America",
		latitude: 39.768403,
		longitude: -86.158068,
	},
	Jacksonville: {
		continent: "North America",
		latitude: 30.3321838,
		longitude: -81.655651,
	},
	"Kansas City": {
		continent: "North America",
		latitude: 39.0997265,
		longitude: -94.5785667,
	},
	"Las Vegas": {
		continent: "North America",
		latitude: 36.1699412,
		longitude: -115.1398296,
	},
	London: {
		continent: "Europe",
		latitude: 51.5072,
		longitude: -0.1276,
	},
	"Los Angeles": {
		continent: "North America",
		latitude: 34.0522342,
		longitude: -118.2436849,
	},
	Manila: {
		continent: "Asia",
		latitude: 14.5995,
		longitude: 120.9842,
	},
	Memphis: {
		continent: "North America",
		latitude: 35.1495343,
		longitude: -90.0489801,
	},
	Melbourne: {
		continent: "Australia",
		latitude: -37.8136,
		longitude: 144.9631,
	},
	Miami: {
		continent: "North America",
		latitude: 25.7616798,
		longitude: -80.1917902,
	},
	Milwaukee: {
		continent: "North America",
		latitude: 43.0389025,
		longitude: -87.9064736,
	},
	Minneapolis: {
		continent: "North America",
		latitude: 44.977753,
		longitude: -93.2650108,
	},
	Minnesota: {
		continent: "North America",
		latitude: 44.977753,
		longitude: -93.2650108,
	},
	"Mexico City": {
		continent: "North America",
		latitude: 19.4326077,
		longitude: -99.133208,
	},
	Montreal: {
		continent: "North America",
		latitude: 45.5016889,
		longitude: -73.567256,
	},
	"New Jersey": {
		continent: "North America",
		latitude: 40.7357,
		longitude: -74.1724,
	},
	"New Orleans": {
		continent: "North America",
		latitude: 29.9510658,
		longitude: -90.0715323,
	},
	"New York": {
		continent: "North America",
		latitude: 40.7127753,
		longitude: -74.0059728,
	},
	Oakland: {
		continent: "North America",
		latitude: 37.8044,
		longitude: -122.2712,
	},
	"Oklahoma City": {
		continent: "North America",
		latitude: 35.4675602,
		longitude: -97.5164276,
	},
	Orlando: {
		continent: "North America",
		latitude: 28.5383355,
		longitude: -81.3792365,
	},
	Ottawa: {
		continent: "North America",
		latitude: 45.4215296,
		longitude: -75.6971931,
	},
	Paris: {
		continent: "Europe",
		latitude: 48.8566,
		longitude: 2.3522,
	},
	Philadelphia: {
		continent: "North America",
		latitude: 39.9525839,
		longitude: -75.1652215,
	},
	Phoenix: {
		continent: "North America",
		latitude: 33.4483771,
		longitude: -112.0740373,
	},
	Pittsburgh: {
		continent: "North America",
		latitude: 40.4406248,
		longitude: -79.9958864,
	},
	Portland: {
		continent: "North America",
		latitude: 45.5051064,
		longitude: -122.6750261,
	},
	Providence: {
		continent: "North America",
		latitude: 41.824,
		longitude: -71.4128,
	},
	Quebec: {
		continent: "North America",
		latitude: 46.8131,
		longitude: -71.2075,
	},
	"Rio de Janeiro": {
		continent: "South America",
		latitude: -22.9068,
		longitude: -43.1729,
	},
	Rochester: {
		continent: "North America",
		latitude: 43.1566,
		longitude: -77.6088,
	},
	Sacramento: {
		continent: "North America",
		latitude: 38.5815719,
		longitude: -121.4943996,
	},
	"San Antonio": {
		continent: "North America",
		latitude: 29.4241219,
		longitude: -98.4936282,
	},
	"San Diego": {
		continent: "North America",
		latitude: 32.715738,
		longitude: -117.1610838,
	},
	"San Francisco": {
		continent: "North America",
		latitude: 37.7749295,
		longitude: -122.4194155,
	},
	"San Jose": {
		continent: "North America",
		latitude: 37.3382082,
		longitude: -121.8863286,
	},
	Seattle: {
		continent: "North America",
		latitude: 47.6062095,
		longitude: -122.3320708,
	},
	Sheboygan: {
		continent: "North America",
		latitude: 43.7508,
		longitude: -87.7145,
	},
	"St. Louis": {
		continent: "North America",
		latitude: 38.6270025,
		longitude: -90.1994042,
	},
	Syracuse: {
		continent: "North America",
		latitude: 43.0481,
		longitude: -76.1474,
	},
	Tampa: {
		continent: "North America",
		latitude: 27.950575,
		longitude: -82.4571776,
	},
	Tokyo: {
		continent: "Asia",
		latitude: 35.6762,
		longitude: 139.6503,
	},
	Toronto: {
		continent: "North America",
		latitude: 43.653226,
		longitude: -79.3831843,
	},
	"Tri-Cities": {
		continent: "North America",
		latitude: 41.5067,
		longitude: -90.5151,
	},
	Utah: {
		continent: "North America",
		latitude: 39.3209801,
		longitude: -111.0937311,
	},
	Vancouver: {
		continent: "North America",
		latitude: 49.2827291,
		longitude: -123.1207375,
	},
	"Virginia Beach": {
		continent: "North America",
		latitude: 36.8529263,
		longitude: -75.977985,
	},
	Washington: {
		continent: "North America",
		latitude: 38.9072,
		longitude: -77.0369,
	},
	Waterloo: {
		continent: "North America",
		latitude: 42.4928,
		longitude: -92.3426,
	},
	Winnipeg: {
		continent: "North America",
		latitude: 49.8954,
		longitude: -97.1385,
	},
	Belgrade: {
		continent: "Europe",
		latitude: 44.8125,
		longitude: 20.4612,
	},
	Berlin: {
		continent: "Europe",
		latitude: 52.52,
		longitude: 13.405,
	},
	"Buenos Aires": {
		continent: "South America",
		latitude: -34.6037,
		longitude: -58.3816,
	},
	Cairo: {
		continent: "Africa",
		latitude: 30.0444,
		longitude: 31.2357,
	},
	Jakarta: {
		continent: "Asia",
		latitude: -6.2088,
		longitude: 106.8456,
	},
	Kaunas: {
		continent: "Europe",
		latitude: 54.8985,
		longitude: 23.9036,
	},
	Kentucky: {
		continent: "North America",
		latitude: 38.2527,
		longitude: -85.7585,
	},
	Madrid: {
		continent: "Europe",
		latitude: 40.4168,
		longitude: -3.7038,
	},
	Rome: {
		continent: "Europe",
		latitude: 41.9028,
		longitude: 12.4964,
	},
	Singapore: {
		continent: "Asia",
		latitude: 1.3521,
		longitude: 103.8198,
	},
	Sydney: {
		continent: "Australia",
		latitude: -33.8688,
		longitude: 151.2093,
	},

	// 2023-12-23 - new teams
	Athens: {
		continent: "Europe",
		latitude: 37.9838,
		longitude: 23.7275,
	},
	Columbus: {
		continent: "North America",
		latitude: 39.9612,
		longitude: -82.9988,
	},
	Delhi: {
		continent: "Asia",
		latitude: 28.7041,
		longitude: 77.1025,
	},
	Istanbul: {
		continent: "Europe",
		latitude: 41.0082,
		longitude: 28.9784,
	},
	Lisbon: {
		continent: "Europe",
		latitude: 38.7223,
		longitude: -9.1393,
	},
	Raleigh: {
		continent: "North America",
		latitude: 35.7796,
		longitude: -78.6382,
	},
	Seoul: {
		continent: "Asia",
		latitude: 37.5519,
		longitude: 126.9918,
	},

	// 2025-07-14 - new teams
	Amsterdam: {
		continent: "Europe",
		latitude: 52.3676,
		longitude: 4.9041,
	},
	Bogota: {
		continent: "South America",
		latitude: 4.711,
		longitude: -74.0721,
	},
	Boise: {
		continent: "North America",
		latitude: 43.615,
		longitude: -116.2023,
	},
	Brussels: {
		continent: "Europe",
		latitude: 50.8503,
		longitude: 4.3517,
	},
	Copenhagen: {
		continent: "Europe",
		latitude: 55.6761,
		longitude: 12.5683,
	},
	Johannesburg: {
		continent: "Africa",
		latitude: -26.2041,
		longitude: 28.0473,
	},
	Kyiv: {
		continent: "Europe",
		latitude: 50.4501,
		longitude: 30.5234,
	},
	Lagos: {
		continent: "Africa",
		latitude: 6.5244,
		longitude: 3.3792,
	},
	Lima: {
		continent: "South America",
		latitude: -12.0464,
		longitude: -77.0428,
	},
	"McMurdo Station": {
		continent: "Antarctica",
		latitude: -77.8419,
		longitude: 166.6863,
	},
	Moscow: {
		continent: "Europe",
		latitude: 55.7558,
		longitude: 37.6173,
	},
	Nashville: {
		continent: "North America",
		latitude: 36.1627,
		longitude: -86.7816,
	},
	Omaha: {
		continent: "North America",
		latitude: 41.2565,
		longitude: -95.9345,
	},
	Santiago: {
		continent: "South America",
		latitude: -33.4489,
		longitude: -70.6693,
	},
	Stockholm: {
		continent: "Europe",
		latitude: 59.3293,
		longitude: 18.0686,
	},
	Tehran: {
		continent: "Asia",
		latitude: 35.6892,
		longitude: 51.389,
	},
	"Tel Aviv": {
		continent: "Asia",
		latitude: 32.0853,
		longitude: 34.7818,
	},
	Taipei: {
		continent: "Asia",
		latitude: 25.0329,
		longitude: 121.5654,
	},
	Warsaw: {
		continent: "Europe",
		latitude: 52.2297,
		longitude: 21.0122,
	},

	// 2025-07-19
	Riyadh: {
		continent: "Asia",
		latitude: 24.7136,
		longitude: 46.6753,
	},
};

export default geographicCoordinates;
