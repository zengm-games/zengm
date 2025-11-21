export const getStartingAndBackupGoalies = <
	T extends {
		injured: boolean;
		numConsecutiveGamesG?: number;
		compositeRating: {
			goalkeeping: number;
		};
		pos: string;
	},
>(
	goalies: T[],
): [T, T] => {
	const starter = goalies.find((p) => !p.injured);
	if (
		starter &&
		starter.numConsecutiveGamesG !== undefined &&
		starter.numConsecutiveGamesG > 1
	) {
		// Swap starter and backup, if appropriate based on composite rating OR if starter has played 10+ consecutive games and the backup is actually a goalie
		const backup = goalies.find((p) => !p.injured && p !== starter);
		if (
			backup &&
			(backup.compositeRating.goalkeeping >
				starter.compositeRating.goalkeeping ||
				(starter.numConsecutiveGamesG >= 10 && backup.pos === "G"))
		) {
			return [backup, starter];
		}

		return [starter, backup ?? goalies.find((p) => p !== starter)!];
	}

	return [goalies[0]!, goalies[1]!];
};
