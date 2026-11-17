import { POS_NUMBERS } from "../../../common/constants.baseball.ts";
import type { Player, Team } from "../../../common/types.ts";
import { groupByUnique, last, orderBy } from "../../../common/utils.ts";
import SelectMultiple from "../../components/SelectMultiple/index.tsx";
import { processPlayerStats } from "../../util/processPlayerStats.ts";

export type BaseballDepth = Extract<
	NonNullable<Team["depth"]>,
	{ LP: number[] }
>;

// Positions in the order they appear in a starting lineup, which is also the order of the D and DP depth charts after the pitcher
const LINEUP_SLOTS = Object.keys(POS_NUMBERS) as (keyof typeof POS_NUMBERS)[];

export const getStartingLineup = ({
	depth,
	dh,
	players,
}: {
	depth: BaseballDepth;
	dh: boolean;
	players: Player[];
}) => {
	const playersByPid = groupByUnique(players, (p) => p.pid);
	const defense = dh ? depth.D : depth.DP;

	return LINEUP_SLOTS.filter((slot) => dh || slot !== "DH").map((slot) => {
		const pid = slot === "P" ? depth.P[0] : defense[POS_NUMBERS[slot] - 2];
		return {
			slot,
			p: pid === undefined ? undefined : playersByPid[pid],
		};
	});
};

// Swap rather than insert, so the rest of the rotation and the bullpen roles are not shifted
export const setStartingPitcher = (depth: BaseballDepth, pid: number) => {
	const P = [...depth.P];
	const index = P.indexOf(pid);
	if (index <= 0) {
		return depth;
	}

	[P[0], P[index]] = [P[index]!, P[0]!];
	return { ...depth, P };
};

const getPitcherLabel = (p: Player) => {
	const ratings = last(p.ratings);
	const stats = p.stats.at(-1);
	const keyStats =
		stats && stats.gp
			? processPlayerStats(stats, ["keyStats"]).keyStats
			: undefined;

	return `${p.firstName} ${p.lastName} (${ratings.pos}, ${ratings.ovr} ovr)${keyStats ? ` ${keyStats}` : ""}`;
};

export const StartingPitcherSelect = ({
	depth,
	disabled,
	inputId,
	onChange,
	players,
}: {
	depth: BaseballDepth;
	disabled: boolean;
	inputId: string;
	onChange: (pid: number) => void;
	players: Player[];
}) => {
	const options = orderBy(
		players.filter((p) => {
			const pos = last(p.ratings).pos;
			return pos === "SP" || pos === "RP";
		}),
		[(p) => (last(p.ratings).pos === "SP" ? 0 : 1), (p) => last(p.ratings).ovr],
		["asc", "desc"],
	).map((p) => ({
		pid: p.pid,
		label: getPitcherLabel(p),
	}));

	return (
		<>
			<label htmlFor={inputId} className="form-label mb-1">
				Starting pitcher
			</label>
			<SelectMultiple
				inputId={inputId}
				disabled={disabled}
				isClearable={false}
				options={options}
				value={options.find((option) => option.pid === depth.P[0])}
				getOptionLabel={(option) => option.label}
				getOptionValue={(option) => String(option.pid)}
				onChange={(option) => {
					if (option) {
						onChange(option.pid);
					}
				}}
			/>
		</>
	);
};
