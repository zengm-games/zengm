import clsx from "clsx";
import { bySport } from "../../common/sportFunctions.ts";
import type { View } from "../../common/types.ts";
import { MoreLinks } from "../components/MoreLinks.tsx";
import { NewsBlock } from "../components/NewsBlock.tsx";
import { PlayerNameLabels } from "../components/PlayerNameLabels.tsx";
import { RatingWithChange } from "../components/RatingWithChange.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers } from "../util/helpers.ts";
import { useLocal } from "../util/local.ts";

const PlayerList = ({
	challengeNoRatings,
	players,
	season,
	userTid,
}: {
	challengeNoRatings: boolean;
	players: NonNullable<View<"seasonRecap">["playersRising"]>;
	season: number;
	userTid: number;
}) => {
	if (players.length === 0) {
		return <p>None</p>;
	}

	return (
		<ol
			style={{
				paddingLeft: 20,
			}}
		>
			{players.map((p, i) => (
				<li
					key={p.pid}
					className={clsx({
						"mt-2": i > 0,
					})}
				>
					<span
						className={clsx({
							"p-1 table-info": userTid === p.tid,
						})}
					>
						<PlayerNameLabels
							pid={p.pid}
							season={season}
							pos={p.ratings.pos}
							skills={p.ratings.skills}
							defaultWatch={p.watch}
							firstName={p.firstName}
							lastName={p.lastName}
						/>{" "}
						<a
							href={helpers.leagueUrl([
								"roster",
								`${p.abbrev}_${p.tid}`,
								season,
							])}
						>
							{p.abbrev}
						</a>
					</span>
					<br />
					{!challengeNoRatings ? (
						<>
							<RatingWithChange change={p.ratings.dovr}>
								{p.ratings.ovr}
							</RatingWithChange>{" "}
							ovr,{" "}
							<RatingWithChange change={p.ratings.dpot}>
								{p.ratings.pot}
							</RatingWithChange>{" "}
							pot,{" "}
						</>
					) : null}
					{p.age} yo
				</li>
			))}
		</ol>
	);
};

const AwardList = ({
	awardWinners,
	season,
	userTid,
}: {
	awardWinners: NonNullable<View<"seasonRecap">["awardWinners"]>;
	season: number;
	userTid: number;
}) => (
	<ul className="list-unstyled">
		{awardWinners.map(({ key, name, winner }) => (
			<li key={key} className="mb-2">
				<b>{name}:</b>{" "}
				{winner ? (
					<span
						className={clsx({
							"p-1 table-info": userTid === winner.tid,
						})}
					>
						<a href={helpers.leagueUrl(["player", winner.pid])}>
							{winner.name}
						</a>{" "}
						(
						<a
							href={helpers.leagueUrl([
								"roster",
								`${winner.abbrev}_${winner.tid}`,
								season,
							])}
						>
							{winner.abbrev}
						</a>
						)
					</span>
				) : (
					"???"
				)}
			</li>
		))}
	</ul>
);

const LeaderList = ({
	leaders,
	season,
	userTid,
}: {
	leaders: NonNullable<View<"seasonRecap">["leagueLeaders"]>;
	season: number;
	userTid: number;
}) => {
	if (leaders.length === 0) {
		return <p>None</p>;
	}

	return (
		<ol
			style={{
				paddingLeft: 20,
			}}
		>
			{leaders.map((leader) => {
				const numberToDisplay = bySport({
					baseball: helpers.numberWithCommas(leader.value),
					basketball: helpers.roundStat(leader.value, leader.stat),
					football: helpers.numberWithCommas(leader.value),
					hockey: helpers.numberWithCommas(leader.value),
				});

				return (
					<li key={leader.stat} className="mb-2">
						<span
							className={clsx({
								"p-1 table-info": userTid === leader.tid,
							})}
						>
							<PlayerNameLabels
								pid={leader.pid}
								firstName={leader.firstName}
								lastName={leader.lastName}
							/>{" "}
							<a
								href={helpers.leagueUrl([
									"roster",
									`${leader.abbrev}_${leader.tid}`,
									season,
								])}
							>
								{leader.abbrev}
							</a>
						</span>
						<br />
						{numberToDisplay} {leader.stat}
					</li>
				);
			})}
		</ol>
	);
};

const SeasonRecap = (props: View<"seasonRecap">) => {
	const { season } = props;

	useTitleBar({
		title: "Season Recap",
		dropdownView: "season_recap",
		dropdownFields: {
			seasonsHistory: season,
		},
	});
	const { challengeNoRatings, userTid } = useLocal([
		"challengeNoRatings",
		"userTid",
	]);

	return (
		<>
			<MoreLinks type="league" page="season_recap" />
			{props.notCompleted ? (
				<p>
					The {season} season is still in progress. Check back after the
					playoffs end.
				</p>
			) : props.invalidSeason ? (
				<p>No season recap is available for {season}.</p>
			) : (
				<div style={{ maxWidth: 1400 }}>
					<p>
						Related:{" "}
						<a href={helpers.leagueUrl(["history", season])}>Season Summary</a>{" "}
						|{" "}
						<a href={helpers.leagueUrl(["leaders", season])}>League Leaders</a>{" "}
						| <a href={helpers.leagueUrl(["news", "all", season])}>News Feed</a>
					</p>

					<div className="row">
						<div className="col-sm-6 col-lg-3">
							<h2>Champion</h2>
							{props.champion ? (
								<p>
									<span
										className={clsx({
											"p-1 table-info": userTid === props.champion.tid,
										})}
									>
										<b>
											<a
												href={helpers.leagueUrl([
													"roster",
													`${props.champion.abbrev}_${props.champion.tid}`,
													season,
												])}
											>
												{props.champion.region} {props.champion.name}
											</a>
										</b>
									</span>
									<br />
									{helpers.formatRecord(props.champion)}
									{props.finals ? (
										<>
											<br />
											Defeated{" "}
											<a
												href={helpers.leagueUrl([
													"roster",
													`${props.finals.loser.abbrev}_${props.finals.loser.tid}`,
													season,
												])}
											>
												{props.finals.loser.region} {props.finals.loser.name}
											</a>
											, {props.finals.winnerWins}-{props.finals.loserWins}
										</>
									) : null}
									<br />
									<a href={helpers.leagueUrl(["playoffs", season])}>
										Playoffs Bracket
									</a>
								</p>
							) : (
								<p>???</p>
							)}
						</div>
						<div className="col-sm-6 col-lg-3">
							<h2>Major Awards</h2>
							<AwardList
								awardWinners={props.awardWinners}
								season={season}
								userTid={userTid}
							/>
						</div>
						<div className="col-sm-6 col-lg-3">
							<h2>League Leaders</h2>
							<LeaderList
								leaders={props.leagueLeaders}
								season={season}
								userTid={userTid}
							/>
						</div>
						<div className="col-sm-6 col-lg-3">
							<h2>Notable Events</h2>
							<p>
								{props.eventCounts.trades} trades
								<br />
								{props.eventCounts.retirements} retirements
								<br />
								{props.eventCounts.tragedies} deaths
								<br />
								{props.eventCounts.feats} statistical feats
							</p>
						</div>
						<div className="col-sm-6 col-lg-3">
							<h2>Rating Risers</h2>
							<PlayerList
								challengeNoRatings={challengeNoRatings}
								players={props.playersRising}
								season={season}
								userTid={userTid}
							/>
						</div>
						<div className="col-sm-6 col-lg-3">
							<h2>Rating Fallers</h2>
							<PlayerList
								challengeNoRatings={challengeNoRatings}
								players={props.playersFalling}
								season={season}
								userTid={userTid}
							/>
						</div>
						<div className="col-12 col-lg-6">
							<h2>Event Highlights</h2>
							{props.notableEvents.length > 0 ? (
								<div className="row">
									{props.notableEvents.map((event) => (
										<div key={event.eid} className="col-sm-6 col-xl-4 mb-3">
											<NewsBlock
												event={event}
												season={season}
												teams={props.teams}
												userTid={userTid}
											/>
										</div>
									))}
								</div>
							) : (
								<p>None</p>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SeasonRecap;
