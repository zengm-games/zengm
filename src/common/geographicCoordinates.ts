const geographicCoordinates: Record<
	string,
	{
		latitude: number;
		longitude: number;
		outsideNorthAmerica?: boolean;
	}
> = {
	Albuquerque: {
		latitude: 35.0844,
		longitude: -106.6504,
	},
	Anchorage: {
		latitude: 61.2175,
		longitude: -149.8978,
	},
	Anderson: {
		latitude: 40.1053,
		longitude: -85.6803,
	},
	Atlanta: {
		latitude: 33.7489954,
		longitude: -84.3879824,
	},
	Austin: {
		latitude: 30.267153,
		longitude: -97.7430608,
	},
	Baltimore: {
		latitude: 39.2903848,
		longitude: -76.6121893,
	},
	Beijing: {
		latitude: 39.9042,
		longitude: 116.4074,
		outsideNorthAmerica: true,
	},
	Boston: {
		latitude: 42.3600825,
		longitude: -71.0588801,
	},
	Buffalo: {
		latitude: 42.8864468,
		longitude: -78.8783689,
	},
	Brooklyn: {
		latitude: 40.6781784,
		longitude: -73.9441579,
	},
	Calgary: {
		latitude: 51.0447331,
		longitude: -114.0718831,
	},
	Charlotte: {
		latitude: 35.2270869,
		longitude: -80.8431267,
	},
	Chicago: {
		latitude: 41.8781136,
		longitude: -87.6297982,
	},
	Cincinnati: {
		latitude: 39.1031182,
		longitude: -84.5120196,
	},
	Cleveland: {
		latitude: 41.49932,
		longitude: -81.6943605,
	},
	Dallas: {
		latitude: 32.7766642,
		longitude: -96.7969879,
	},
	Denver: {
		latitude: 39.7392358,
		longitude: -104.990251,
	},
	Detroit: {
		latitude: 42.331427,
		longitude: -83.0457538,
	},
	Edmonton: {
		latitude: 53.5461,
		longitude: -113.4937,
	},
	"Fort Wayne": {
		latitude: 41.0793,
		longitude: -85.1394,
	},
	"Golden State": {
		latitude: 37.7749295,
		longitude: -122.4194155,
	},
	Hawaii: {
		latitude: 19.8967662,
		longitude: -155.5827818,
	},
	Houston: {
		latitude: 29.7604267,
		longitude: -95.3698028,
	},
	Indianapolis: {
		latitude: 39.768403,
		longitude: -86.158068,
	},
	Jacksonville: {
		latitude: 30.3321838,
		longitude: -81.655651,
	},
	"Kansas City": {
		latitude: 39.0997265,
		longitude: -94.5785667,
	},
	"Las Vegas": {
		latitude: 36.1699412,
		longitude: -115.1398296,
	},
	London: {
		latitude: 51.5072,
		longitude: -0.1276,
		outsideNorthAmerica: true,
	},
	"Los Angeles": {
		latitude: 34.0522342,
		longitude: -118.2436849,
	},
	Manila: {
		latitude: 14.5995,
		longitude: 120.9842,
		outsideNorthAmerica: true,
	},
	Memphis: {
		latitude: 35.1495343,
		longitude: -90.0489801,
	},
	Melbourne: {
		latitude: -37.8136,
		longitude: 144.9631,
		outsideNorthAmerica: true,
	},
	Miami: {
		latitude: 25.7616798,
		longitude: -80.1917902,
	},
	Milwaukee: {
		latitude: 43.0389025,
		longitude: -87.9064736,
	},
	Minneapolis: {
		latitude: 44.977753,
		longitude: -93.2650108,
	},
	"Mexico City": {
		latitude: 19.4326077,
		longitude: -99.133208,
	},
	Montreal: {
		latitude: 45.5016889,
		longitude: -73.567256,
	},
	"New Jersey": {
		latitude: 40.7357,
		longitude: -74.1724,
	},
	"New Orleans": {
		latitude: 29.9510658,
		longitude: -90.0715323,
	},
	"New York": {
		latitude: 40.7127753,
		longitude: -74.0059728,
	},
	Oakland: {
		latitude: 37.8044,
		longitude: -122.2712,
	},
	"Oklahoma City": {
		latitude: 35.4675602,
		longitude: -97.5164276,
	},
	Orlando: {
		latitude: 28.5383355,
		longitude: -81.3792365,
	},
	Ottawa: {
		latitude: 45.4215296,
		longitude: -75.6971931,
	},
	Paris: {
		latitude: 48.8566,
		longitude: 2.3522,
		outsideNorthAmerica: true,
	},
	Philadelphia: {
		latitude: 39.9525839,
		longitude: -75.1652215,
	},
	Phoenix: {
		latitude: 33.4483771,
		longitude: -112.0740373,
	},
	Pittsburgh: {
		latitude: 40.4406248,
		longitude: -79.9958864,
	},
	Portland: {
		latitude: 45.5051064,
		longitude: -122.6750261,
	},
	Providence: {
		latitude: 41.824,
		longitude: -71.4128,
	},
	Quebec: {
		latitude: 46.8131,
		longitude: -71.2075,
	},
	"Rio de Janeiro": {
		latitude: -22.9068,
		longitude: -43.1729,
		outsideNorthAmerica: true,
	},
	Rochester: {
		latitude: 43.1566,
		longitude: -77.6088,
	},
	Sacramento: {
		latitude: 38.5815719,
		longitude: -121.4943996,
	},
	"San Antonio": {
		latitude: 29.4241219,
		longitude: -98.4936282,
	},
	"San Diego": {
		latitude: 32.715738,
		longitude: -117.1610838,
	},
	"San Francisco": {
		latitude: 37.7749295,
		longitude: -122.4194155,
	},
	"San Jose": {
		latitude: 37.3382082,
		longitude: -121.8863286,
	},
	Seattle: {
		latitude: 47.6062095,
		longitude: -122.3320708,
	},
	Sheboygan: {
		latitude: 43.7508,
		longitude: -87.7145,
	},
	"St. Louis": {
		latitude: 38.6270025,
		longitude: -90.1994042,
	},
	Syracuse: {
		latitude: 43.0481,
		longitude: -76.1474,
	},
	Tampa: {
		latitude: 27.950575,
		longitude: -82.4571776,
	},
	Tokyo: {
		latitude: 35.6762,
		longitude: 139.6503,
		outsideNorthAmerica: true,
	},
	Toronto: {
		latitude: 43.653226,
		longitude: -79.3831843,
	},
	"Tri-Cities": {
		latitude: 41.5067,
		longitude: -90.5151,
	},
	Utah: {
		latitude: 39.3209801,
		longitude: -111.0937311,
	},
	Vancouver: {
		latitude: 49.2827291,
		longitude: -123.1207375,
	},
	"Virginia Beach": {
		latitude: 36.8529263,
		longitude: -75.977985,
	},
	Washington: {
		latitude: 38.9072,
		longitude: -77.0369,
	},
	Waterloo: {
		latitude: 42.4928,
		longitude: -92.3426,
	},
	Winnipeg: {
		latitude: 49.8954,
		longitude: -97.1385,
	},
	Belgrade: {
		latitude: 44.8125,
		longitude: 20.4612,
		outsideNorthAmerica: true,
	},
	Berlin: {
		latitude: 52.52,
		longitude: 13.405,
		outsideNorthAmerica: true,
	},
	"Buenos Aires": {
		latitude: -34.6037,
		longitude: -58.3816,
		outsideNorthAmerica: true,
	},
	Cairo: {
		latitude: 30.0444,
		longitude: 31.2357,
		outsideNorthAmerica: true,
	},
	Jakarta: {
		latitude: -6.2088,
		longitude: 106.8456,
		outsideNorthAmerica: true,
	},
	Kaunas: {
		latitude: 54.8985,
		longitude: 23.9036,
		outsideNorthAmerica: true,
	},
	Kentucky: {
		latitude: 38.2527,
		longitude: -85.7585,
	},
	Madrid: {
		latitude: 40.4168,
		longitude: -3.7038,
		outsideNorthAmerica: true,
	},
	Rome: {
		latitude: 41.9028,
		longitude: 12.4964,
		outsideNorthAmerica: true,
	},
	Singapore: {
		latitude: 1.3521,
		longitude: 103.8198,
		outsideNorthAmerica: true,
	},
	Sydney: {
		latitude: -33.8688,
		longitude: 151.2093,
		outsideNorthAmerica: true,
	},
};

export default geographicCoordinates;
