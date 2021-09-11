import useTitleBar from "../hooks/useTitleBar";
import { helpers } from "../util";
import type { View } from "../../common/types";
import { isSport } from "../../common";

const AllStar = ({ showDunk }: View<"allStar">) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	useTitleBar({ title: "All-Star Events" });

	return (
		<div className="d-sm-flex">
			{showDunk ? (
				<div className="card" style={{ maxWidth: "18rem" }}>
					<div className="card-body">
						<h3 className="card-title">Slam Dunk Contest</h3>
						<p className="card-text">
							The top 4 dunkers in the league compete to see who is the best.
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
			<div
				className={`card ${showDunk ? "ml-sm-3 mt-3 mt-sm-0" : ""}`}
				style={{ maxWidth: "18rem" }}
			>
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
		</div>
	);
};

export default AllStar;
