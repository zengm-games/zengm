import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import Overall from "./TeamHistory/Overall";
import Players from "./TeamHistory/Players";
import RetiredJerseyNumbers from "./TeamHistory/RetiredJerseyNumbers";
import Seasons from "./TeamHistory/Seasons";

const GmHistory = ({
	bestRecord,
	championships,
	finalsAppearances,
	history,
	players,
	playoffAppearances,
	stats,
	totalLost,
	totalTied,
	totalWinp,
	totalWon,
	userTid,
	worstRecord,
}: View<"gmHistory">) => {
	useTitleBar({
		title: "GM History",
	});

	return (
		<>
			<div className="row">
				<div className="col-sm-5 col-md-3">
					<Overall
						bestRecord={bestRecord}
						championships={championships}
						finalsAppearances={finalsAppearances}
						playoffAppearances={playoffAppearances}
						totalLost={totalLost}
						totalTied={totalTied}
						totalWinp={totalWinp}
						totalWon={totalWon}
						worstRecord={worstRecord}
					/>

					<Seasons history={history} />
				</div>
				<div className="col-sm-7 col-md-9 mt-3 mt-sm-0">
					<p>Some explanation text</p>
					<Players players={players} stats={stats} tid={userTid} />
				</div>
			</div>
		</>
	);
};

export default GmHistory;
