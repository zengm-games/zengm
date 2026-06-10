type PlayerLike = {
	srID?: string;
};

type PickLike = {
	p: PlayerLike;
};

export const NUM_EIGHTY_TWO_ZERO_DRAFT_ROUNDS = 12;

export const MAX_RANDOM_TEAM_RETRIES = 20;

export const getDisabledCount = (round: number) => {
	return round - 1;
};

export const isDuplicateSrID = (p: PlayerLike, picks: readonly PickLike[]) => {
	return (
		p.srID !== undefined &&
		picks.some((pick) => pick.p.srID !== undefined && pick.p.srID === p.srID)
	);
};

export const countPickablePlayers = (
	players: readonly PlayerLike[],
	disabledCount: number,
	picks: readonly PickLike[],
) => {
	return players.filter((p, i) => {
		return i >= disabledCount && !isDuplicateSrID(p, picks);
	}).length;
};

export const getPickValidationError = ({
	disabledCount,
	pickIndex,
	picks,
	players,
}: {
	disabledCount: number;
	pickIndex: number;
	picks: readonly PickLike[];
	players: readonly PlayerLike[];
}) => {
	if (
		!Number.isInteger(pickIndex) ||
		pickIndex < 0 ||
		pickIndex >= players.length
	) {
		return "Invalid player";
	}

	if (pickIndex < disabledCount) {
		return "This player is locked";
	}

	if (isDuplicateSrID(players[pickIndex]!, picks)) {
		return "You already drafted this player";
	}
};
