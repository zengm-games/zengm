import { getCol } from "../../common/getCol.ts";

// Could be the number (stat value), undefined (no stat, like old box score), player object (in which case we look inside and find number or undefined)
type POrValue = number | undefined | any;

const getInner = (pOrValue: POrValue, stat: string, raw?: boolean) => {
	if (pOrValue === undefined) {
		return undefined;
	}
	const value = typeof pOrValue === "number" ? pOrValue : pOrValue[stat];
	if (value === undefined) {
		return undefined;
	}
	const statName = raw ? stat : getCol(`stat:${stat}`).title;
	return `${value} ${statName}`;
};

// For basketball, pass a player object and a stat key, and derive the value of the stat and the abbrev of the stat from that.
// For other sports, pass the actual number of the stat and a stat key (`raw` false) or whatever custom abbrev you want (`raw` true).
type FormatLiveGameStat = {
	(pOrValue: POrValue[], stat: string[], raw?: boolean): string;
	(pOrValue: POrValue, stat: string, raw?: boolean): string;
};

export const formatLiveGameStat: FormatLiveGameStat = (
	pOrValue: POrValue | POrValue[],
	stat: string | string[],
	raw?: boolean,
) => {
	if (Array.isArray(stat)) {
		let missingStat = false;
		const output = ` (${stat
			.map((s, i) => {
				const inner = getInner((pOrValue as any)[i], s, raw);
				if (inner === undefined) {
					missingStat = true;
				}
				return inner;
			})
			.join(", ")})`;

		return missingStat ? "" : output;
	}

	// Old box score without this data.
	if (pOrValue === undefined) {
		return "";
	}
	return ` (${getInner(pOrValue as any, stat, raw)})`;
};
