import { POS_NUMBERS_INVERSE } from "../../common/constants.baseball";

export const expandFieldingStats = ({
	allPositions,
	rows,
	stats,
	statsProperty,
}: {
	allPositions?: boolean;
	rows: any[];
	stats: string[];

	// When this is undefined, assume stats are in root object
	statsProperty?: string;
}) => {
	return rows
		.map(row => {
			const rowStats = statsProperty !== undefined ? row[statsProperty] : row;

			let posIndexes;
			if (allPositions) {
				posIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
			} else {
				posIndexes = [];
				for (let i = 0; i < rowStats.gpF.length; i++) {
					if (rowStats.gpF[i] !== undefined) {
						posIndexes.push(i);
					}
				}
			}

			return posIndexes.map(posIndex => {
				let newRow;

				if (statsProperty !== undefined) {
					newRow = {
						...row,
						[statsProperty]: {
							...rowStats,
							pos: (POS_NUMBERS_INVERSE as any)[posIndex + 1],
						},
					};

					for (const key of stats) {
						if (Array.isArray(newRow[statsProperty][key])) {
							newRow[statsProperty][key] =
								newRow[statsProperty][key][posIndex] ?? 0;
						}
					}
				} else {
					newRow = {
						...row,
						pos: (POS_NUMBERS_INVERSE as any)[posIndex + 1],
					};

					for (const key of stats) {
						if (Array.isArray(newRow[key])) {
							newRow[key] = newRow[key][posIndex] ?? 0;
						}
					}
				}

				return newRow;
			});
		})
		.flat() as any;
};
