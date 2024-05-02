import { m, AnimatePresence } from "framer-motion";
import { NewsBlock } from "../../components";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import { memo, useEffect, useRef, useState } from "react";

const transition = { duration: 0.4, type: "tween" };

// Inlined from https://github.com/uidotdev/usehooks/blob/dfa6623fcc2dcad3b466def4e0495b3f38af962b/index.js#L1241C1-L1262C2 cause it seems silly to depend on that whole package for this one little function. But then I noticed a couple bug and sent a PR https://github.com/uidotdev/usehooks/pull/302
const useThrottle = <T extends unknown>(value: T, interval: number): T => {
	const [throttledValue, setThrottledValue] = useState(value);
	const lastUpdated = useRef(0);

	useEffect(() => {
		const now = Date.now();
		const sinceLastUpdate = now - lastUpdated.current;

		if (sinceLastUpdate >= interval) {
			lastUpdated.current = now;
			setThrottledValue(value);
		} else {
			const id = window.setTimeout(() => {
				lastUpdated.current = Date.now();
				setThrottledValue(value);
			}, interval - sinceLastUpdate);

			return () => window.clearTimeout(id);
		}
	}, [value, interval]);

	return throttledValue;
};

type HeadlinesProps = Pick<
	View<"leagueDashboard">,
	"events" | "season" | "userTid" | "teams"
>;

const Headlines = ({ events, season, teams, userTid }: HeadlinesProps) => {
	const throttledEvents = useThrottle(events, 2000);

	return (
		<>
			<h2 className="mt-3" style={{ marginBottom: "-0.5rem" }}>
				League Headlines
			</h2>
			<div className="row mb-1">
				<AnimatePresence initial={false}>
					{throttledEvents.map(event => {
						return (
							<m.div
								key={event.eid}
								className="col-xl-6 col-lg-12 col-md-4 col-sm-6 mt-3"
								layout
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={transition}
								exit={{ transition: { duration: 0 } }}
							>
								<NewsBlock
									event={event}
									season={season}
									teams={teams}
									userTid={userTid}
								/>
							</m.div>
						);
					})}
				</AnimatePresence>
			</div>
			<a href={helpers.leagueUrl(["news"])}>» News Feed</a>
		</>
	);
};

const ThrottledComponent = memo(
	Headlines,

	// Unclear why these manual types are needed, they didn't used to be
	(prevProps: HeadlinesProps, nextProps: HeadlinesProps) => {
		// Complicated memo function is because we don't want the throttle timer to start when doing a render where nothing changed, and we can't maintain referential equality of props.events because it is passed between the UI and worker.
		if (
			prevProps.season !== nextProps.season ||
			prevProps.userTid !== nextProps.userTid
		) {
			return false;
		}

		const prevEIDs = prevProps.events.map(event => event.eid);
		const nextEIDs = nextProps.events.map(event => event.eid);
		return JSON.stringify(prevEIDs) === JSON.stringify(nextEIDs);
	},
);

export default ThrottledComponent;
