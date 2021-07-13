import PropTypes from "prop-types";
import { helpers } from "../../../ui/util";
import type { ActualProps } from ".";
import { AWARD_NAMES } from "../../../common";

const Winner = ({
	award,
	defense = false,
	finals = false,
	season,
	userTid,
}: {
	award: ActualProps["awards"][number];
	defense?: boolean;
	finals?: boolean;
	season: number;
	userTid: number;
}) => {
	if (!award) {
		// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
		return finals ? <>"???"</> : <p>???</p>;
	}

	const stats = defense ? ["trb", "blk", "stl"] : ["pts", "trb", "ast"];

	const nameAndStats = (
		<>
			<span className={award.tid === userTid ? "table-info" : undefined}>
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
			{stats.map(stat => `${award[stat].toFixed(1)} ${stat}`).join(", ")}
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
				<h2>League Champs</h2>
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
							{AWARD_NAMES.finalsMvp}:{" "}
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
				{awards.bestRecordConfs
					.filter((a: any) => a !== undefined)
					.map((t: any, i: number) =>
						t !== undefined ? (
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
									{t.otl !== undefined && t.otl > 0 ? <>-{t.otl}</> : null}
									{t.tied !== undefined && t.tied > 0 ? <>-{t.tied}</> : null})
								</span>
								<br />
							</p>
						) : null,
					)}
				<h2>{AWARD_NAMES.mvp}</h2>
				<Winner award={awards.mvp} season={season} userTid={userTid} />
			</div>
			<div className="col-sm-12 col-6">
				<h2>{AWARD_NAMES.dpoy}</h2>
				<Winner award={awards.dpoy} season={season} userTid={userTid} defense />
				<h2>{AWARD_NAMES.smoy}</h2>
				<Winner award={awards.smoy} season={season} userTid={userTid} />
				<h2>{AWARD_NAMES.mip}</h2>
				<Winner award={awards.mip} season={season} userTid={userTid} />
				<h2>{AWARD_NAMES.roy}</h2>
				<Winner award={awards.roy} season={season} userTid={userTid} />
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
