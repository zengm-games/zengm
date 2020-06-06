import React from "react";
import type { View } from "../../../common/types";
import { NewsBlock } from "../../components";
import { helpers } from "../../util";

const Headlines = ({
	events,
	eventsTeams,
	season,
	userTid,
}: Pick<
	View<"leagueDashboard">,
	"events" | "eventsTeams" | "season" | "userTid"
>) => {
	return (
		<>
			<h2 className="mt-2" style={{ marginBottom: "-0.5rem" }}>
				League Headlines
			</h2>
			<div className="row mb-1">
				{events.length === 0 ? (
					<div className="col mt-3">
						Nothing has happened yet! Start playing and the top headlines from
						your team and around the league will show up here.
					</div>
				) : null}
				{events.map(event => {
					return (
						<div key={event.eid} className="col-xl-6 col-md-12 col-sm-6 mt-3">
							<NewsBlock
								event={event}
								season={season}
								teams={eventsTeams}
								userTid={userTid}
							/>
						</div>
					);
				})}
			</div>
			<a href={helpers.leagueUrl(["news"])}>» News Feed</a>
		</>
	);
};

export default Headlines;
