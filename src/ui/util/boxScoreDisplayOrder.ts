// Box score teams are stored with the home team first (index 0), same as in the game sim and play-by-play events. But by convention, the away team is displayed first. So use these when rendering both teams, rather than changing the order of the underlying data.

export const TEAM_NUMS_DISPLAY_ORDER = [1, 0] as const;

export const teamsInDisplayOrder = <T>(teams: readonly [T, T]): [T, T] => [
	teams[1],
	teams[0],
];
