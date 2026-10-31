import clsx from "clsx";
import { POMYMARKET_NAME } from "../../common/constants.ts";
import { roundWinPercents } from "../../common/winProbability.ts";
import { TEAM_NUMS_DISPLAY_ORDER } from "../util/boxScoreDisplayOrder.ts";
import { getLiveWinp } from "../util/getLiveWinp.ts";
import { useLocal } from "../util/local.ts";

type WinPercents = ReturnType<typeof roundWinPercents>;

const isFavorite = ({ percents }: WinPercents, i: 0 | 1) => {
	return percents[i] > percents[i === 0 ? 1 : 0];
};

export const PomymarketPercent = ({
	i,
	preGame,
	winPercents,
}: {
	i: 0 | 1;
	preGame?: boolean;
	winPercents: WinPercents;
}) => {
	const percent = `${winPercents.percents[i]}%`;

	if (preGame) {
		return (
			<span
				className="text-body-secondary"
				title={`${POMYMARKET_NAME} win percentage before the game`}
			>
				{percent} pre-game
			</span>
		);
	}

	return (
		<span
			className={clsx({
				"text-success": !winPercents.even && isFavorite(winPercents, i),
				"text-danger": !winPercents.even && !isFavorite(winPercents, i),
			})}
			title={`${POMYMARKET_NAME} win percentage`}
		>
			{percent}
		</span>
	);
};

export const PomymarketBar = ({
	className,
	order,
	winPercents,
}: {
	className?: string;
	order: readonly [0 | 1, 0 | 1];
	winPercents: WinPercents;
}) => {
	return (
		<div className={clsx("d-flex", className)} style={{ height: 3 }}>
			{order.map((i) => (
				<div
					key={i}
					className={clsx({
						"bg-secondary": winPercents.even,
						"bg-success": !winPercents.even && isFavorite(winPercents, i),
						"bg-danger": !winPercents.even && !isFavorite(winPercents, i),
					})}
					style={{ width: `${winPercents.percents[i]}%` }}
				/>
			))}
		</div>
	);
};

export const PomymarketLive = ({
	boxScore,
	quarterLength,
	sportState,
}: {
	boxScore: any;
	quarterLength: number;
	sportState: any;
}) => {
	const { homeCourtAdvantage, pomymarket } = useLocal([
		"homeCourtAdvantage",
		"pomymarket",
	]);

	if (!pomymarket || boxScore.exhibition) {
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

	return (
		<div className="mx-auto mt-1 small" style={{ maxWidth: 300 }}>
			<div className="d-flex justify-content-between">
				{TEAM_NUMS_DISPLAY_ORDER.map((i) => (
					<div key={i}>
						{boxScore.teams[i].abbrev}{" "}
						<PomymarketPercent i={i} winPercents={winPercents} />
					</div>
				))}
			</div>
			<PomymarketBar
				order={TEAM_NUMS_DISPLAY_ORDER}
				winPercents={winPercents}
			/>
			{liveWinp.tied ? <div className="text-center">Tied</div> : null}
		</div>
	);
};
