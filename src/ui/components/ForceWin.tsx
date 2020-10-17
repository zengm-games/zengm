import React, { useEffect, useRef, useState } from "react";
import { toWorker, useLocalShallow } from "../util";

type Team = {
	tid: number;
};

const style = {
	width: 140,
};

const ForceWin = ({
	className,
	game,
}: {
	className?: string;
	game: {
		gid: number;
		forceWin?: number;
		teams: [Team, Team];
	};
}) => {
	const [state, setState] = useState<
		undefined | "saving" | "saved" | "error"
	>();
	const timeoutID = useRef<number | undefined>();

	const { godMode, teamInfoCache } = useLocalShallow(state => ({
		godMode: state.godMode,
		teamInfoCache: state.teamInfoCache,
	}));

	useEffect(() => {
		return () => {
			window.clearTimeout(timeoutID.current);
		};
	}, []);

	let forceWin = null;
	if (godMode) {
		const id = `force-win-${game.gid}`;

		forceWin = (
			<form className="form-inline my-1">
				<label className="mr-1" htmlFor={id}>
					Force win?
				</label>
				<select
					className="form-control form-control-sm"
					disabled={state === "saving"}
					id={id}
					onChange={async event => {
						window.clearTimeout(timeoutID.current);

						setState("saving");
						let tid: number | undefined;
						if (event.target.value !== "none") {
							const tidParsed = parseInt(event.target.value);
							if (!Number.isNaN(tidParsed)) {
								tid = tidParsed;
							}
						}
						try {
							await toWorker("main", "setForceWin", game.gid, tid);
						} catch (error) {
							setState("error");
							throw error;
						}
						setState("saved");

						timeoutID.current = window.setTimeout(() => {
							setState(undefined);
						}, 5000);
					}}
					style={style}
					defaultValue={game.forceWin ?? "none"}
				>
					<option value="none">None</option>
					{[game.teams[1], game.teams[0]].map(({ tid }) => (
						<option key={tid} value={tid}>
							{teamInfoCache[tid]?.region} {teamInfoCache[tid]?.name}
						</option>
					))}
				</select>
				{state === "saved" ? (
					<span className="ml-1 glyphicon glyphicon-ok text-success" />
				) : null}
			</form>
		);
	}

	return <div className={className}>{forceWin}</div>;
};

export default ForceWin;
