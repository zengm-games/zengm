import type { MouseEvent } from "react";
import { bySport } from "../../common";
import BoxScoreRowBasketball from "./BoxScoreRow.basketball";
import BoxScoreRowFootball from "./BoxScoreRow.football";

const BoxScoreRow = (props: {
	className?: string;
	exhibition?: boolean;
	lastStarter?: boolean;
	liveGameInProgress?: boolean;
	onClick?: (event: MouseEvent) => void;
	p: any;
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
