import type { PlayerWithoutKey } from "../../common/types.ts";

type PlayerLike = {
	srID?: string;
};

type PickLike = {
	p: PlayerLike;
};

export const getLockedCount = (round: number) => {
	return Math.floor((round - 1) / 2);
};

export const isDuplicateSrID = (p: PlayerLike, picks: readonly PickLike[]) => {
	return (
		p.srID !== undefined &&
		picks.some((pick) => pick.p.srID !== undefined && pick.p.srID === p.srID)
	);
};

export const countPickablePlayers = (
	players: {
		p: PlayerWithoutKey;
		locked: boolean;
	}[],
	picks: readonly PickLike[],
) => {
	return players.filter(({ p, locked }) => {
		return !locked && !isDuplicateSrID(p, picks);
	}).length;
};

export const getPickValidationError = ({
	playerInfo,
	picks,
}: {
	playerInfo:
		| {
				p: PlayerWithoutKey;
				locked: boolean;
		  }
		| undefined;
	picks: readonly PickLike[];
}) => {
	if (!playerInfo) {
		return "Invalid player";
	}

	if (playerInfo.locked) {
		return "This player is locked";
	}

	if (isDuplicateSrID(playerInfo.p, picks)) {
		return "You already drafted this player";
	}
};
