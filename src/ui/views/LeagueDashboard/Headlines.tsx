import { m, AnimatePresence } from "framer-motion";
import { NewsBlock } from "../../components";
import { helpers, useLocal } from "../../util";
import type { View } from "../../../common/types";
import throttle from "lodash-es/throttle";
import { Component, createElement, memo } from "react";
import type { ComponentType } from "react";

// Similar to react-throttle-render
const throttleRender = (wait: number) => {
	return function <Props>(component: ComponentType<Props>) {
		type State = { props: Props };
		class Throttled extends Component<Props, State> {
			throttledSetState: ((state: State) => void) & {
				cancel: () => void;
			};

			constructor(props: Props) {
				super(props);
				this.state = {
					props,
				};

				this.throttledSetState = throttle(
					(nextState: State) => this.setState(nextState),
					wait,
				);
			}

			shouldComponentUpdate(nextProps: Props, nextState: State) {
				return this.state !== nextState;
			}

			UNSAFE_componentWillReceiveProps(nextProps: Props) {
				this.throttledSetState({ props: nextProps });
			}

			componentWillUnmount() {
				this.throttledSetState.cancel();
			}

			render() {
				return createElement(component, this.state.props);
			}
		}

		return Throttled;
	};
};

const transition = { duration: 0.4, type: "tween" };

const Headlines = ({
	events,
	season,
	userTid,
}: Pick<View<"leagueDashboard">, "events" | "season" | "userTid">) => {
	const teamInfoCache = useLocal(state => state.teamInfoCache);

	return (
		<>
			<h2 className="mt-3" style={{ marginBottom: "-0.5rem" }}>
				League Headlines
			</h2>
			<div className="row mb-1">
				<AnimatePresence initial={false}>
					{events.map(event => {
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
									teams={teamInfoCache}
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
	throttleRender(2000)(Headlines),
	(prevProps, nextProps) => {
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
