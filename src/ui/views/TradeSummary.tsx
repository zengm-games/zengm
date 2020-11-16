import React from "react";
import useTitleBar from "../hooks/useTitleBar";
import type { View } from "../../common/types";
import { helpers } from "../util";
import { PlayerNameLabels } from "../components";
import { PHASE_TEXT } from "../../common";

const PickText = ({
	asset,
	season,
}: {
	asset: {
		abbrev?: string;
		round: number;
		season: number | "fantasy" | "expansion";
		tid: number;
	};
	season: number;
}) => {
	return (
		<>
			{asset.season === "fantasy"
				? `${season} fantasy draft`
				: asset.season === "expansion"
				? `${season} expansion draft`
				: asset.season}{" "}
			{helpers.ordinal(asset.round)} round pick
			{asset.abbrev ? (
				<>
					{" "}
					(
					<a
						href={helpers.leagueUrl([
							"roster",
							`${asset.abbrev}_${asset.tid}`,
							typeof asset.season === "number" ? asset.season : season,
						])}
					>
						{asset.abbrev}
					</a>
					)
				</>
			) : null}
		</>
	);
};

const TradeSummary = ({ phase, season, stat, teams }: View<"tradeSummary">) => {
	useTitleBar({
		title: "Trade Summary",
	});

	if (!teams || season === undefined || phase === undefined) {
		return <p>Trade not found.</p>;
	}

	return (
		<>
			<p>
				Trade occurred during the{" "}
				<b>
					{season} {PHASE_TEXT[phase]}
				</b>
			</p>
			<div className="d-sm-flex">
				{teams.map((t, i) => (
					<div
						key={t.tid}
						className={i === 0 ? "mb-3 mb-sm-0 mr-sm-5" : undefined}
					>
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
									<div key={i} className="mb-2">
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
											{helpers.formatCurrency(
												asset.contract.amount / 1000,
												"M",
											)}{" "}
											thru {asset.contract.exp}
											<br />
											{asset.ovr} ovr, {asset.pot} pot, {asset.age} years old
											<br />
											{helpers.roundStat(asset.stat, "ws")} {stat} after trade
										</div>
									</div>
								);
							}

							if (asset.type === "deletedPlayer") {
								return (
									<div key={i} className="mb-2">
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

							if (asset.type === "unrealizedPick") {
								return (
									<div key={i} className="mb-2">
										<PickText asset={asset} season={season} />
									</div>
								);
							}

							if (asset.type === "realizedPick") {
								return (
									<div key={i} className="mb-2">
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
											<span className="text-muted">
												via <PickText asset={asset} season={season} />
											</span>
											<br />
											{asset.ovr} ovr, {asset.pot} pot, {asset.age} years old
											<br />
											{helpers.roundStat(asset.stat, "ws")} {stat} after trade
										</div>
									</div>
								);
							}

							return "???";
						})}
						<b>
							Total {stat} after trade: {helpers.roundStat(t.statSum, "ws")}
						</b>
					</div>
				))}
			</div>
		</>
	);
};

export default TradeSummary;
