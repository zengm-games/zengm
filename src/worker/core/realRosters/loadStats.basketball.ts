import type { SeasonLeaders } from "../../../common/types.ts";

export type BasketballStats = {
	seasonLeaders: Record<number, Omit<SeasonLeaders, "season" | "ratingsFuzz">>;
	stats: Record<
		string,
		{
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
			pm100?: number;
			onOff100?: number;
		}[]
	>;
};

// Cache the promise rather than the result, so concurrent calls (like a prefetch followed by actually creating a league) only fetch once
let cachedPromise: Promise<BasketballStats> | undefined;
const loadData = () => {
	if (!cachedPromise) {
		cachedPromise = (async () => {
			const response = await fetch("/gen/real-player-stats.json");
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status}`);
			}
			return (await response.json()) as BasketballStats;
		})();

		// Allow retrying after an error
		cachedPromise.catch(() => {
			cachedPromise = undefined;
		});
	}

	return cachedPromise;
};

export default loadData;
