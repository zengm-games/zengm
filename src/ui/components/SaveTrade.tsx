import classNames from "classnames";
import { memo, useState, type SyntheticEvent, useLayoutEffect } from "react";
import { toWorker } from "../util";
import { hashSavedTrade } from "../../common/hashSavedTrade";

const SaveTrade = memo(
	({
		className,
		tradeTeams,
	}: {
		className?: string;
		tradeTeams: [
			{
				tid: number;
				pids: number[];
				dpids: number[];
			},
			{
				tid: number;
				pids: number[];
				dpids: number[];
			},
		];
	}) => {
		const [saved, setSaved] = useState<number | undefined>();

		const empty = tradeTeams.every(
			t => t.pids.length === 0 && t.dpids.length === 0,
		);
		const hash = hashSavedTrade(tradeTeams);

		useLayoutEffect(() => {
			let mounted = true;

			(async () => {
				const value = await toWorker("main", "getSavedTrade", hash);
				if (mounted) {
					setSaved(value);
				}
			})();

			return () => {
				mounted = false;
			};
		}, [hash]);

		const handleClick = async (event: SyntheticEvent) => {
			event.preventDefault();
			const newSaved = saved === 0 ? 1 : 0;
			setSaved(newSaved);
			await toWorker("main", "setSavedTrade", {
				saved: newSaved,
				hash,
				tid: tradeTeams[0].tid,
			});
		};

		if (!empty && saved !== undefined && saved > 0) {
			return (
				<button
					className={classNames("btn btn-link p-0", className)}
					onClick={handleClick}
					title={"Unsave Trade"}
				>
					<span
						className={`glyphicon glyphicon-flag watch ms-0 watch-active-${saved}`}
					/>
				</button>
			);
		}

		return (
			<button
				className={classNames("btn btn-link p-0", className)}
				onClick={handleClick}
				title="Save Trade"
				disabled={saved === undefined || empty}
			>
				<span className="glyphicon glyphicon-flag watch ms-0" />
			</button>
		);
	},
);

export default SaveTrade;
