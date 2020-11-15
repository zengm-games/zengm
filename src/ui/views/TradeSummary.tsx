import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import { PlayerNameLabels, SafeHtml } from "../components";
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
			<p>
				Trade during the{" "}
				<b>
					{season} {PHASE_TEXT[phase]}
				</b>
			</p>
			<div className="d-flex">
				{teams.map((t, i) => (
					<div key={t.tid} className={i === 0 ? "mr-5" : undefined}>
						<h2>
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
						</h2>
						{t.assets.map((asset, i) => {
							if (asset.type === "player") {
								return (
									<div key={i} className="mb-3">
										<div>
											<PlayerNameLabels
												pid={asset.pid}
												pos={asset.pos}
												skills={asset.skills}
												watch={asset.watch}
											>
												{asset.name}
											</PlayerNameLabels>
										</div>
										<div>
											{asset.ovr} ovr, {asset.pot} pot
											<br />
											{helpers.formatCurrency(
												asset.contract.amount / 1000,
												"M",
											)}{" "}
											thru {asset.contract.exp}
											<br />
											15 WS after trade
										</div>
									</div>
								);
							}

							if (asset.type === "deletedPlayer") {
								return (
									<div key={i} className="mb-3">
										{asset.name}
										<br />
										{helpers.formatCurrency(
											asset.contract.amount / 1000,
											"M",
										)}{" "}
										thru {asset.contract.exp}
									</div>
								);
							}

							return "???";
						})}
						<b>Total WS after trade: 75</b>
						<li>
							Bob Jones{" "}
							<span className="text-muted">via 2010 2nd round pick (ATL)</span>
						</li>
						<li>2010 2nd round pick (ATL)</li>
						<li>2015 fantasy draft 1st round pick</li>
						<li className="mt-2">Total WS after trade: 17.6</li>
					</div>
				))}
			</div>
		</>
	);
};

export default TradeSummary;
