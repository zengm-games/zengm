import classNames from "classnames";
import { memo, useState, type SyntheticEvent, useLayoutEffect } from "react";
import { toWorker } from "../util";
import type { TradeTeams } from "../../common/types";
import { hashSavedTrade } from "../../common/hashSavedTrade";

const SaveTrade = memo(
	({
		className,
		onChange,
		tradeTeams,
	}: {
		className?: string;
		pid: number;
		onChange?: (saved: number) => void;
		tradeTeams: TradeTeams;
	}) => {
		const [saved, setSaved] = useState<number | undefined>();

		const empty = tradeTeams.every(
			t => t.pids.length === 0 && t.dpids.length === 0,
		);
		const hash = hashSavedTrade(tradeTeams);

		useLayoutEffect(() => {
			let mounted = true;
			setSaved(undefined);

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
			if (onChange) {
				onChange(newSaved);
			}
			await toWorker("main", "setSavedTrade", {
				saved: newSaved,
				hash,
				tid: tradeTeams[0].tid,
			});
		};

		if (!empty && saved !== undefined && saved > 0) {
			return (
				<button
					className="btn btn-link p-0"
					onClick={handleClick}
					title={"Unsave Trade"}
				>
					<span
						className={classNames(
							`glyphicon glyphicon-flag watch ms-0 watch-active-${saved}`,
							className,
						)}
					/>
				</button>
			);
		}

		return (
			<button
				className="btn btn-link p-0"
				onClick={handleClick}
				title="Save Trade"
				disabled={saved === undefined || empty}
			>
				<span
					className={classNames(
						"glyphicon glyphicon-flag watch ms-0",
						className,
					)}
				/>
			</button>
		);
	},
);

export default SaveTrade;
