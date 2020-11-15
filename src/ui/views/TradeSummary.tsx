import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import { SafeHtml } from "../components";
import { PHASE_TEXT } from "../../common";

const TradeSummary = ({ phase, season, teams }: View<"tradeSummary">) => {
	useTitleBar({
		title: "Trade Summary",
	});

	if (!teams || season === undefined || phase === undefined) {
		return <p>Trade not found.</p>;
	}

	return (
		<>
			<h2>
				Trade during the {season} {PHASE_TEXT[phase]}
			</h2>
			<div className="d-flex">
				{teams.map((t, i) => (
					<div key={t.tid} className={i === 0 ? "mr-5" : undefined}>
						<h3>
							<a
								href={helpers.leagueUrl([
									"roster",
									`${t.abbrev}_${t.tid}`,
									season,
								])}
							>
								{t.region} {t.name}
							</a>{" "}
							recieved:
						</h3>
						<ul className="list-unstyled">
							{t.assets.map((asset, i) => (
								<li key={i}>
									<SafeHtml dirty={asset} />
								</li>
							))}
							<li>
								Bob Jones{" "}
								<span className="text-muted">
									via 2010 2nd round pick (ATL)
								</span>
							</li>
							<li>2010 2nd round pick (ATL)</li>
							<li>2015 fantasy draft 1st round pick</li>
							<li className="mt-2">Total WS after trade: 17.6</li>
						</ul>
					</div>
				))}
			</div>
		</>
	);
};

export default TradeSummary;
