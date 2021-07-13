import { RecordAndPlayoffs } from "../../components";
import type { View } from "../../../common/types";
import { helpers } from "../../util";

const Overall = ({
	bestRecord,
	championships,
	finalsAppearances,
	playoffAppearances,
	totalLost,
	totalOtl,
	totalTied,
	totalWinp,
	totalWon,
	worstRecord,
	title = "Overall",
}: Pick<
	View<"teamHistory">,
	| "bestRecord"
	| "championships"
	| "finalsAppearances"
	| "playoffAppearances"
	| "totalLost"
	| "totalOtl"
	| "totalTied"
	| "totalWinp"
	| "totalWon"
	| "worstRecord"
> & {
	title?: string;
}) => {
	let record = `${totalWon}-${totalLost}`;
	if (totalOtl > 0) {
		record += `-${totalOtl}`;
	}
	if (totalTied > 0) {
		record += `-${totalTied}`;
	}

	return (
		<>
			<h2>{title}</h2>
			<div className="mb-2">
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
						abbrev={bestRecord.abbrev}
						tid={bestRecord.tid}
						lost={bestRecord.lost}
						season={bestRecord.season}
						tied={bestRecord.tied}
						otl={bestRecord.otl}
						won={bestRecord.won}
					/>
				) : (
					"???"
				)}
				<br />
				Worst Record:{" "}
				{worstRecord ? (
					<RecordAndPlayoffs
						abbrev={worstRecord.abbrev}
						tid={worstRecord.tid}
						lost={worstRecord.lost}
						season={worstRecord.season}
						tied={worstRecord.tied}
						otl={worstRecord.otl}
						won={worstRecord.won}
					/>
				) : (
					"???"
				)}
			</div>
		</>
	);
};

export default Overall;
