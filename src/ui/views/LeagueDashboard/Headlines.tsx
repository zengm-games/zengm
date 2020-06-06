import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { NewsBlock } from "../../components";
import { helpers } from "../../util";
import type { View } from "../../../common/types";
import throttle from "lodash/throttle";

const throttleRender = (wait: number) => {
	return function <Props>(component: React.ComponentType<Props>) {
		type State = { props: Props };
		class Throttled extends React.Component<Props, State> {
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
				return React.createElement(component, this.state.props);
			}
		}

		return Throttled;
	};
};

const transition = { duration: 0.5, type: "tween" };

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
			<h2 className="mt-3" style={{ marginBottom: "-0.5rem" }}>
				League Headlines
			</h2>
			<div className="row mb-1">
				<AnimatePresence initial={false}>
					{events.map(event => {
						return (
							<motion.div
								key={event.eid}
								className="col-xl-6 col-lg-12 col-md-4 col-sm-6 mt-3"
								positionTransition={transition}
								initial={{ opacity: 0, scale: 0.5 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ transition: { duration: 0 } }}
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
			</div>
			<a href={helpers.leagueUrl(["news"])}>» News Feed</a>
		</>
	);
};

const ThrottledComponent = throttleRender(2000)(Headlines);

export default ThrottledComponent;
