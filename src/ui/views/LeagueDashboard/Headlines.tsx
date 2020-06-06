import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { NewsBlock } from "../../components";
import { helpers } from "../../util";
import type { View } from "../../../common/types";

const transition = { duration: 0.2, type: "tween" };

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
				) : (
					<AnimatePresence initial={false}>
						{events.map(event => {
							return (
								<motion.div
									key={event.eid}
									className="col-xl-6 col-md-12 col-sm-6 mt-3"
									positionTransition={transition}
									initial={{ opacity: 0, y: -100 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ transition: { duration: 0 } }}
									transition={{ transition }}
								>
									<NewsBlock
										event={event}
										season={season}
										teams={eventsTeams}
										userTid={userTid}
									/>
								</motion.div>
							);
						})}
					</AnimatePresence>
				)}
			</div>
			<a href={helpers.leagueUrl(["news"])}>» News Feed</a>
		</>
	);
};

export default Headlines;
