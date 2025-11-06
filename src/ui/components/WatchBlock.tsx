import clsx from "clsx";
import { memo, useEffect, useState, type SyntheticEvent } from "react";
import { toWorker, useLocalPartial } from "../util/index.ts";
import { crossTabEmitter } from "../util/crossTabEmitter.ts";

type Props = {
	className?: string;
	pid: number;
} & (
	| {
			// Do we want to make this controlled or not? Similar to defaultValue vs value in React, except "uncontrolled" means it's actually controlled by crossTabEmitter
			defaultWatch?: undefined;
			watch: number;
	  }
	| {
			defaultWatch: number;
			watch?: undefined;
	  }
);

export const Flag = ({
	className,
	watch,
	onClick,
	title,
}: {
	className?: string;
	watch?: number | undefined;
	onClick?: (event: SyntheticEvent) => void;
	title?: string;
}) => {
	return (
		<span
			className={clsx(
				"glyphicon glyphicon-flag watch",
				watch !== undefined && watch > 0 ? `watch-active-${watch}` : undefined,
				className,
			)}
			onClick={onClick}
			title={title}
		/>
	);
};

const WatchBlock = memo(({ className, defaultWatch, pid, watch }: Props) => {
	const { numWatchColors } = useLocalPartial(["numWatchColors"]);

	const [localWatch, setLocalWatch] = useState(defaultWatch ?? 0);
	const actualWatch = watch ?? localWatch;

	const handleClick = async (event: SyntheticEvent) => {
		event.preventDefault();
		const newWatch = (actualWatch + 1) % (numWatchColors + 1);
		await toWorker("main", "updatePlayerWatch", { pid, watch: newWatch });
	};

	useEffect(() => {
		if (defaultWatch !== undefined) {
			const updateLocalWatch = async () => {
				const newLocalWatch = await toWorker("main", "getPlayerWatch", pid);
				setLocalWatch(newLocalWatch);
			};

			// Need to listen for bulk action updates
			const unbind = crossTabEmitter.on("updateWatch", async (pids) => {
				if (pids.includes(pid)) {
					await updateLocalWatch();
				}
			});
			return unbind;
		}
	}, [defaultWatch, pid]);

	return (
		<Flag
			className={className}
			onClick={handleClick}
			title={
				actualWatch !== undefined && actualWatch > 0
					? numWatchColors > 1
						? "Cycle watch list"
						: "Remove from watch list"
					: "Add to watch list"
			}
			watch={actualWatch}
		/>
	);
});

export default WatchBlock;
