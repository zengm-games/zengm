import classNames from "classnames";
import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import { PlayerNameLabels, RatingWithChange } from "../components";

const PlayerList = ({
	players,
	season,
	userTid,
}: {
	players: any[];
	season: number;
	userTid: number;
}) => {
	return (
		<ol
			style={{
				paddingLeft: 20,
			}}
		>
			{players.map((p, i) => (
				<li
					className={classNames({
						"mt-2": i > 0,
					})}
				>
					<span
						className={classNames({
							"p-1 table-info": userTid === p.tid,
						})}
					>
						<PlayerNameLabels
							pid={p.pid}
							season={season}
							pos={p.ratings.pos}
							skills={p.ratings.skills}
							watch={p.watch}
						>
							{p.name}
						</PlayerNameLabels>
						<a
							href={helpers.leagueUrl([
								"roster",
								`${p.abbrev}_${p.tid}`,
								season,
							])}
							className="ml-2"
						>
							{p.abbrev}
						</a>
					</span>
					<br />
					{p.age} yo,{" "}
					<RatingWithChange change={p.ratings.dovr}>
						{p.ratings.ovr}
					</RatingWithChange>{" "}
					ovr,{" "}
					<RatingWithChange change={p.ratings.dpot}>
						{p.ratings.pot}
					</RatingWithChange>{" "}
					pot
				</li>
			))}
		</ol>
	);
};

const SeasonPreview = ({
	playersDeclining,
	playersImproving,
	playersTop,
	season,
	userTid,
}: View<"seasonPreview">) => {
	useTitleBar({
		title: "Season Preview",
		dropdownView: "season_preview",
		dropdownFields: {
			seasons: season,
		},
	});
	return (
		<>
			<div className="row">
				<div className="col-md-4">
					<h2>Top Players</h2>
					<PlayerList players={playersTop} season={season} userTid={userTid} />
				</div>
				<div className="col-md-4">
					<h2>Improving Players</h2>
					<PlayerList
						players={playersImproving}
						season={season}
						userTid={userTid}
					/>
				</div>
				<div className="col-md-4">
					<h2>Declining Players</h2>
					<PlayerList
						players={playersDeclining}
						season={season}
						userTid={userTid}
					/>
				</div>
			</div>
			<div className="row">
				<div className="col-md-4">
					<h2>Top Teams</h2>
				</div>
				<div className="col-md-4">
					<h2>Improving Teams</h2>
				</div>
				<div className="col-md-4">
					<h2>Declining Teams</h2>
				</div>
			</div>
		</>
	);
};

export default SeasonPreview;
