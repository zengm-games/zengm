import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import { isSport } from "../../common";

const style = { maxWidth: "18rem" };

const AllStar = ({
	numPlayersDunk,
	numPlayersThree,
	showDunk,
	showThree,
}: View<"allStar">) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	useTitleBar({ title: "All-Star Events" });

	return (
		<div
			className="d-flex flex-wrap"
			style={{
				gap: "1rem",
			}}
		>
			{showDunk ? (
				<div className="card" style={style}>
					<div className="card-body">
						<h3 className="card-title">Slam Dunk Contest</h3>
						<p className="card-text">
							The top {helpers.numberWithCommas(numPlayersDunk)} dunkers in the
							league compete to see who is the best.
						</p>
						<a
							href={helpers.leagueUrl(["all_star", "dunk"])}
							className="btn btn-primary stretched-link"
						>
							Come on and slam!
						</a>
					</div>
				</div>
			) : null}
			{showThree ? (
				<div className="card" style={style}>
					<div className="card-body">
						<h3 className="card-title">Three Point Contest</h3>
						<p className="card-text">
							The top {helpers.numberWithCommas(numPlayersThree)} shooters in
							the league compete to see who is the best.
						</p>
						<a
							href={helpers.leagueUrl(["all_star", "three"])}
							className="btn btn-primary stretched-link"
						>
							Start shooting
						</a>
					</div>
				</div>
			) : null}
			<div className="card" style={style}>
				<div className="card-body">
					<h3 className="card-title">All-Star Draft</h3>
					<p className="card-text">
						The top 2 players in the league get to pick their team before the
						All-Star Game.
					</p>
					<a
						href={helpers.leagueUrl(["all_star", "draft"])}
						className="btn btn-primary stretched-link"
					>
						Start the draft
					</a>
				</div>
			</div>
			<div className="card" style={style}>
				<div className="card-body">
					<h3 className="card-title">All-Star History</h3>
					<p className="card-text">
						Summary of All-Star Game and contest results for past seasons
					</p>
					<a
						href={helpers.leagueUrl(["all_star", "history"])}
						className="btn btn-primary stretched-link"
					>
						View history
					</a>
				</div>
			</div>
		</div>
	);
};

export default AllStar;
