import PropTypes from "prop-types";
import React from "react";
import { helpers } from "../../../ui/util";
import type { ActualProps } from ".";

const Winner = ({
	award,
	finals = false,
	season,
	userTid,
}: {
	award: ActualProps["awards"][number];
	finals?: boolean;
	season: number;
	userTid: number;
}) => {
	if (!award) {
		// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
		return finals ? <>"???"</> : <p>???</p>;
	}

	const nameAndStats = (
		<>
			<span className={award.tid === userTid ? "table-info" : undefined}>
				{award.pos}{" "}
				<b>
					<a href={helpers.leagueUrl(["player", award.pid])}>{award.name}</a>
				</b>{" "}
				(
				<a
					href={helpers.leagueUrl([
						"roster",
						`${award.abbrev}_${award.tid}`,
						season,
					])}
				>
					{award.abbrev}
				</a>
				)
			</span>
			<br />
			{award.keyStats}
		</>
	);

	return finals ? nameAndStats : <p>{nameAndStats}</p>;
};

Winner.propTypes = {
	award: PropTypes.object,
	defense: PropTypes.bool,
	finals: PropTypes.bool,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

const AwardsAndChamp = ({
	awards,
	champ,
	confs,
	season,
	userTid,
}: Pick<ActualProps, "awards" | "champ" | "confs" | "season" | "userTid">) => {
	return (
		<div className="row">
			<div className="col-sm-12 col-6">
				<h2>League Champions</h2>
				{champ ? (
					<div>
						<p>
							<span
								className={champ.tid === userTid ? "table-info" : undefined}
							>
								<b>
									<a
										href={helpers.leagueUrl([
											"roster",
											`${champ.seasonAttrs.abbrev}_${champ.tid}`,
											season,
										])}
									>
										{champ.seasonAttrs.region} {champ.seasonAttrs.name}
									</a>
								</b>
							</span>
							<br />
							<a href={helpers.leagueUrl(["playoffs", season])}>
								Playoffs Bracket
							</a>
						</p>
						<p>
							Finals MVP:{" "}
							<Winner
								award={awards.finalsMvp}
								finals
								season={season}
								userTid={userTid}
							/>
						</p>
					</div>
				) : (
					<p>???</p>
				)}
				<h2>Best Record</h2>
				{awards.bestRecordConfs.map((t: any, i: number) => (
					<p key={t.tid}>
						{confs[i].name}:<br />
						<span className={t.tid === userTid ? "table-info" : undefined}>
							<a
								href={helpers.leagueUrl([
									"roster",
									`${t.abbrev}_${t.tid}`,
									season,
								])}
							>
								{t.region} {t.name}
							</a>{" "}
							({t.won}-{t.lost}
							{t.tied !== undefined ? <>-{t.tied}</> : null})
						</span>
						<br />
					</p>
				))}
				<h2>Most Valuable Player</h2>
				<Winner award={awards.mvp} season={season} userTid={userTid} />
			</div>
			<div className="col-sm-12 col-6">
				<h2>Defensive Player of the Year</h2>
				<Winner award={awards.dpoy} season={season} userTid={userTid} />
				<h2>Offensive Rookie of the Year</h2>
				<Winner award={awards.oroy} season={season} userTid={userTid} />
				<h2>Defensive Rookie of the Year</h2>
				<Winner award={awards.droy} season={season} userTid={userTid} />
			</div>
		</div>
	);
};

AwardsAndChamp.propTypes = {
	awards: PropTypes.object.isRequired,
	champ: PropTypes.object.isRequired,
	confs: PropTypes.arrayOf(PropTypes.object).isRequired,
	season: PropTypes.number.isRequired,
	userTid: PropTypes.number.isRequired,
};

export default AwardsAndChamp;
