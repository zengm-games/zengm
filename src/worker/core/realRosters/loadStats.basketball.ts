export type BasketballStats = {
	slug: string;
	season: number;
	abbrev: string;
	playoffs?: true;
	jerseyNumber: string;
	gp?: number;
	gs?: number;
	min?: number;
	fg?: number;
	fga?: number;
	tp?: number;
	tpa?: number;
	ft?: number;
	fta?: number;
	orb?: number;
	drb?: number;
	ast?: number;
	tov?: number;
	stl?: number;
	blk?: number;
	pf?: number;
	pts?: number;
	per?: number;
	astp?: number;
	blkp?: number;
	drbp?: number;
	orbp?: number;
	stlp?: number;
	trbp?: number;
	usgp?: number;
	drtg?: number;
	ortg?: number;
	dws?: number;
	ows?: number;
	obpm?: number;
	dbpm?: number;
	vorp?: number;
	fgAtRim?: number;
	fgaAtRim?: number;
	fgLowPost?: number;
	fgaLowPost?: number;
	fgMidRange?: number;
	fgaMidRange?: number;
	pm?: number;
	ba?: number;
	dd?: number;
	td?: number;
	qd?: number;
	fxf?: number;
	minAvailable?: number;
}[];

let cachedJSON: BasketballStats;
const loadData = async () => {
	if (cachedJSON) {
		return cachedJSON;
	}
	const response = await fetch("/gen/real-player-stats.json");
	cachedJSON = await response.json();
	return cachedJSON;
};

export default loadData;
