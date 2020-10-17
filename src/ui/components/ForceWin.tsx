import React from "react";
import { useLocalShallow } from "../util";

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
		teams: [Team, Team];
	};
}) => {
	const { godMode, teamInfoCache } = useLocalShallow(state => ({
		godMode: state.godMode,
		teamInfoCache: state.teamInfoCache,
	}));

	let forceWin = null;
	if (godMode) {
		const id = `force-win-${game.gid}`;

		forceWin = (
			<form className="form-inline my-1">
				<label className="mr-1" htmlFor={id}>
					Force win?
				</label>
				<select className="form-control form-control-sm" id={id} style={style}>
					<option value="none">None</option>
					{[game.teams[1], game.teams[0]].map(({ tid }) => (
						<option key={tid} value={tid}>
							{teamInfoCache[tid]?.region} {teamInfoCache[tid]?.name}
						</option>
					))}
				</select>
			</form>
		);
	}

	return <div className={className}>{forceWin}</div>;
};

export default ForceWin;
