import React from "react";
import { RecordAndPlayoffs } from "../../components";
import type { View } from "../../../common/types";

const Seasons = ({ history }: Pick<View<"teamHistory">, "history">) => {
	const historySeasons = history.map((h, i) => {
		const recordAndPlayoffs = (
			<RecordAndPlayoffs
				abbrev={h.abbrev}
				lost={h.lost}
				numConfs={h.numConfs}
				numPlayoffRounds={h.numPlayoffRounds}
				playoffRoundsWon={h.playoffRoundsWon}
				season={h.season}
				// Bold championship seasons.
				style={
					h.playoffRoundsWon === h.numPlayoffRounds
						? { fontWeight: "bold" }
						: undefined
				}
				tid={h.tid}
				tied={h.tied}
				won={h.won}
			/>
		);

		let newName;
		if (h.name && (i === 0 || h.name !== history[i - 1].name)) {
			newName = h.name;
		}

		// If a team was inactive for some number of seasons, add some vertical space in the gap
		const gap = i > 0 && h.season + 1 < history[i - 1].season;

		return (
			<div key={h.season} className={gap && !newName ? "mt-2" : undefined}>
				{newName ? (
					<h4 className={i > 0 ? "mt-2" : undefined}>{newName}</h4>
				) : null}
				{recordAndPlayoffs}
				<br />
			</div>
		);
	});

	return (
		<>
			<h2>Seasons</h2>
			{historySeasons}
		</>
	);
};

export default Seasons;
