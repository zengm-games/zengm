import clsx from "clsx";
import { RecordAndPlayoffs } from "../../components/index.tsx";
import type { View } from "../../../common/types.ts";
import { useState } from "react";

const ExpandableNote = ({ note }: { note: string | undefined }) => {
	const [expand, setExpand] = useState(false);

	if (!note) {
		return null;
	}

	// Would be nice to use a button rather than a div, but I couldn't get text-truncate to work there
	return (
		<div
			className={clsx("cursor-pointer", expand ? undefined : "text-truncate")}
			style={expand ? { whiteSpace: "pre-line" } : undefined}
			onClick={() => {
				setExpand(!expand);
			}}
		>
			{note}
		</div>
	);
};

const Seasons = ({ history }: Pick<View<"teamHistory">, "history">) => {
	const numTeamNames = new Set(
		history.map((h) => h.name).filter((name) => name !== undefined),
	).size;

	let prevName = numTeamNames === 1 ? history[0]!.name : undefined;
	const historySeasons = history.map((h, i) => {
		const recordAndPlayoffs = (
			<RecordAndPlayoffs
				abbrev={h.abbrev}
				className={
					h.playoffRoundsWon === h.numPlayoffRounds ? "fw-bold" : undefined
				}
				lost={h.lost}
				otl={h.otl}
				roundsWonText={h.roundsWonText}
				season={h.season}
				tid={h.tid}
				tied={h.tied}
				won={h.won}
			/>
		);

		let newName;
		if (h.name && prevName !== h.name) {
			newName = h.name;
			prevName = h.name;
		}

		// If a team was inactive for some number of seasons, add some vertical space in the gap
		const gap = i > 0 && h.season + 1 < history[i - 1]!.season;

		return (
			<div key={h.season} className={gap && !newName ? "mt-2" : undefined}>
				{newName ? (
					<h4 className={i > 0 ? "mt-2" : undefined}>{newName}</h4>
				) : null}
				{recordAndPlayoffs}
				<ExpandableNote note={h.note} />
			</div>
		);
	});

	return <>{historySeasons}</>;
};

export default Seasons;
