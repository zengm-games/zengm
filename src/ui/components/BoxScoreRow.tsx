import type { MouseEvent } from "react";
import { isSport } from "../../common";
import BoxScoreRowBasketball from "./BoxScoreRow.basketball";
import BoxScoreRowFootball from "./BoxScoreRow.football";

const BoxScoreRow = (props: {
	className?: string;
	lastStarter?: boolean;
	liveGameInProgress?: boolean;
	onClick?: (event: MouseEvent) => void;
	p: any;
	stats?: string[];
}) => {
	if (isSport("football")) {
		return BoxScoreRowFootball(props as any);
	}

	return BoxScoreRowBasketball(props);
};

export default BoxScoreRow;
