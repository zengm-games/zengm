import React from "react";
import { RecordAndPlayoffs } from "../../components";
import type { View } from "../../../common/types";
import { helpers } from "../../util";

const Overall = ({
	abbrev,
	bestRecord,
	championships,
	finalsAppearances,
	playoffAppearances,
	tid,
	totalLost,
	totalTied,
	totalWinp,
	totalWon,
	worstRecord,
}: Pick<
	View<"teamHistory">,
	| "abbrev"
	| "bestRecord"
	| "championships"
	| "finalsAppearances"
	| "playoffAppearances"
	| "tid"
	| "totalLost"
	| "totalTied"
	| "totalWinp"
	| "totalWon"
	| "worstRecord"
>) => {
	let record = `${totalWon}-${totalLost}`;
	if (totalTied > 0) {
		record += `-${totalTied}`;
	}

	return (
		<>
			<h2>Overall</h2>
			<p>
				Record: {record} ({helpers.roundWinp(totalWinp)})
				<br />
				Playoff Appearances: {playoffAppearances}
				<br />
				Finals Appearances: {finalsAppearances}
				<br />
				Championships: {championships}
				<br />
				Best Record:{" "}
				{bestRecord ? (
					<RecordAndPlayoffs
						abbrev={abbrev}
						tid={tid}
						lost={bestRecord.lost}
						season={bestRecord.season}
						tied={bestRecord.tied}
						won={bestRecord.won}
					/>
				) : (
					"???"
				)}
				<br />
				Worst Record:{" "}
				{worstRecord ? (
					<RecordAndPlayoffs
						abbrev={abbrev}
						tid={tid}
						lost={worstRecord.lost}
						season={worstRecord.season}
						tied={worstRecord.tied}
						won={worstRecord.won}
					/>
				) : (
					"???"
				)}
			</p>
		</>
	);
};

export default Overall;
