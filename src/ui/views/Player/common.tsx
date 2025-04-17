import type { JSX, ReactNode } from "react";
import { helpers } from "../../util/index.ts";

export const SeasonLink = ({
	className,
	pid,
	season,
}: {
	className?: string;
	pid: number;
	season: number;
}) => {
	return (
		<a
			className={className}
			href={helpers.leagueUrl(["player_game_log", pid, season])}
		>
			{season}
		</a>
	);
};

export const highlightLeaderText = (
	<>
		<span className="highlight-leader">Bold</span> indicates league leader
	</>
);

export const MaybeBold = ({
	bold,
	children,
}: {
	bold: boolean | undefined;
	children: ReactNode;
}) => {
	if (bold) {
		return <span className="highlight-leader">{children}</span>;
	}

	return children as JSX.Element;
};
