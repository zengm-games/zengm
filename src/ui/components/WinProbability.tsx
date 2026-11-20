import clsx from "clsx";
import type { ReactNode } from "react";
import { roundWinPercents } from "../../common/gamePrediction.ts";
import { TEAM_NUMS_DISPLAY_ORDER } from "../util/boxScoreDisplayOrder.ts";
import { getLiveWinp } from "../util/getLiveWinp.ts";
import type { LiveGameSportState } from "../util/LiveGamePlayback.ts";
import { useLocal } from "../util/local.ts";

type WinPercents = ReturnType<typeof roundWinPercents>;

// In a live game, at 50/50 the team displayed first counts as the favorite, because showing neither team as the favorite would make the colors flash on and off whenever a close game goes back and forth across 50/50. Before a game, the odds don't change rapidly, so 50/50 can be shown as even.
const getFavoriteStatus = (percents: WinPercents, i: 0 | 1, live: boolean) => {
	const other = percents[i === 0 ? 1 : 0];
	if (percents[i] === other) {
		if (!live) {
			return "even";
		}
		return i === TEAM_NUMS_DISPLAY_ORDER[0] ? "favorite" : "underdog";
	}
	return percents[i] > other ? "favorite" : "underdog";
};

export const WinPercent = ({
	i,
	live = false,
	preGame,
	winPercents,
}: {
	i: 0 | 1;
	live?: boolean;
	preGame?: boolean;
	winPercents: WinPercents;
}) => {
	const percent = `${winPercents[i]}%`;

	if (preGame) {
		return <span className="text-body-secondary">{percent} pre-game</span>;
	}

	const status = getFavoriteStatus(winPercents, i, live);

	return (
		<span
			className={clsx({
				"text-success": status === "favorite",
				"text-danger": status === "underdog",
			})}
		>
			{percent}
		</span>
	);
};

export const WinProbabilityBar = ({
	order,
	winPercents,
}: {
	order: readonly [0 | 1, 0 | 1];
	winPercents: WinPercents;
}) => {
	return (
		<div className="d-flex" style={{ height: 3 }}>
			{order.map((i) => {
				// Only used in live games
				const status = getFavoriteStatus(winPercents, i, true);
				return (
					<div
						key={i}
						className={clsx({
							"bg-success": status === "favorite",
							"bg-danger": status === "underdog",
						})}
						style={{ width: `${winPercents[i]}%` }}
					/>
				);
			})}
		</div>
	);
};

export const LiveWinProbability = ({
	boxScore,
	quarterLength,
	sportState,
}: {
	boxScore: any;
	quarterLength: number;
	sportState: LiveGameSportState;
}) => {
	const { homeCourtAdvantage } = useLocal(["homeCourtAdvantage"]);

	if (boxScore.exhibition) {
		return null;
	}

	const liveWinp = getLiveWinp({
		boxScore,
		homeCourtAdvantage,
		quarterLength,
		sportState,
	});
	if (!liveWinp) {
		return null;
	}

	const winPercents = roundWinPercents(liveWinp.prob, liveWinp.resolved);
	const [left, right] = TEAM_NUMS_DISPLAY_ORDER;

	return (
		<div className="mx-auto small" style={{ maxWidth: 300 }}>
			<div
				className="d-flex align-items-center gap-1"
				style={{ fontVariantNumeric: "tabular-nums" }}
				title="Win probability"
			>
				<WidestPercentWidth className="text-end">
					<WinPercent i={left} live winPercents={winPercents} />
				</WidestPercentWidth>
				<div className="flex-grow-1">
					<WinProbabilityBar
						order={TEAM_NUMS_DISPLAY_ORDER}
						winPercents={winPercents}
					/>
				</div>
				<WidestPercentWidth>
					<WinPercent i={right} live winPercents={winPercents} />
				</WidestPercentWidth>
			</div>
			{liveWinp.tied ? <div className="text-center">Tied</div> : null}
		</div>
	);
};

// Always as wide as "100%", so the bar next to it doesn't change size when the number of digits changes. The hidden text and the real text are in the same grid cell, so the cell is as wide as the wider of them.
const WidestPercentWidth = ({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) => {
	return (
		<span className="d-inline-grid">
			<span aria-hidden className="invisible" style={{ gridArea: "1 / 1" }}>
				100%
			</span>
			<span className={className} style={{ gridArea: "1 / 1" }}>
				{children}
			</span>
		</span>
	);
};
