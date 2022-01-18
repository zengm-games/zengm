import { helpers } from "../../../ui/util";
import type { ActualProps } from ".";
import { AWARD_NAMES } from "../../../common";

const Winner = ({
	award,
	finals = false,
	season,
	type,
	userTid,
}: {
	award: ActualProps["awards"][number];
	finals?: boolean;
	season: number;
	type: "any" | "defense" | "goalie";
	userTid: number;
}) => {
	if (!award) {
		// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
		return finals ? <>???</> : <p>???</p>;
	}

	let stats;
	if (type === "defense") {
		stats = `${helpers.roundStat(award.tk, "tk")} TK, ${helpers.roundStat(
			award.hit,
			"hit",
		)} HIT`;
		if (!finals) {
			stats += `, ${helpers.roundStat(award.dps, "dps")} DPS`;
		}
	} else if (
		type === "goalie" ||
		(type === "any" && award.gps > award.ops + award.dps)
	) {
		stats = `${helpers.roundStat(award.gaa, "gaa")} GAA, ${helpers.roundStat(
			award.svPct,
			"svPct",
		)} SV%`;
		if (!finals) {
			stats += `, ${helpers.roundStat(award.gps, "gps")} GPS`;
		}
	} else {
		stats = `${helpers.roundStat(award.g, "g")} G, ${helpers.roundStat(
			award.a,
			"a",
		)} A, ${helpers.roundStat(award.pts, "pts")} P`;
		if (!finals) {
			stats += `, ${helpers.roundStat(
				award.ops + award.dps + award.gps,
				"ps",
			)} PS`;
		}
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
			{stats}
		</>
	);

	return finals ? nameAndStats : <p>{nameAndStats}</p>;
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
								type="any"
							/>
						</p>
					</div>
				) : (
					<p>???</p>
				)}
				<h2>Best Record</h2>
				{awards.bestRecordConfs
					.filter((a: any) => a !== undefined)
					.map((t: any, i: number) => (
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
					))}
				<h2>{AWARD_NAMES.mvp}</h2>
				<Winner
					award={awards.mvp}
					season={season}
					userTid={userTid}
					type="any"
				/>
			</div>
			<div className="col-sm-12 col-6">
				<h2>{AWARD_NAMES.dpoy}</h2>
				<Winner
					award={awards.dpoy}
					season={season}
					userTid={userTid}
					type="defense"
				/>
				<h2>{AWARD_NAMES.dfoy}</h2>
				<Winner
					award={awards.dfoy}
					season={season}
					userTid={userTid}
					type="defense"
				/>
				<h2>{AWARD_NAMES.goy}</h2>
				<Winner
					award={awards.goy}
					season={season}
					userTid={userTid}
					type="goalie"
				/>
				<h2>{AWARD_NAMES.roy}</h2>
				<Winner
					award={awards.roy}
					season={season}
					userTid={userTid}
					type="any"
				/>
			</div>
		</div>
	);
};

export default AwardsAndChamp;
