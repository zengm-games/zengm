import type { MouseEvent } from "react";
import { bySport } from "../../common/index.ts";
import BoxScoreRowBasketball from "./BoxScoreRow.basketball.tsx";
import BoxScoreRowFootball from "./BoxScoreRow.football.tsx";

const BoxScoreRow = (props: {
	className?: string;
	exhibition?: boolean;
	lastStarter?: boolean;
	liveGameInProgress?: boolean;
	onClick?: (event: MouseEvent) => void;
	p: any;
	season: number;
	stats?: string[];
}) => {
	return bySport({
		baseball: BoxScoreRowFootball(props as any),
		basketball: BoxScoreRowBasketball(props),
		football: BoxScoreRowFootball(props as any),
		hockey: BoxScoreRowFootball(props as any),
	});
};

export default BoxScoreRow;
