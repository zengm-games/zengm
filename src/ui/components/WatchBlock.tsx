import clsx from "clsx";
import { memo, useEffect, useState, type SyntheticEvent } from "react";
import { toWorker, useLocalPartial } from "../util/index.ts";
import { crossTabEmitter } from "../util/crossTabEmitter.ts";

type Props = {
	className?: string;
	pid: number;
} & (
	| {
			// Do we want to make this controlled or not? Similar to defaultValue vs value in React, except "uncontrolled" means it's actually controlled by crossTabEmitter. Because of crossTabEmitter onChange is not required (since some reaction to state change will happen automatically) but it is required if you want this to work in exhibition games or if you want to respond a tick faster than waiting for crossTabEmitter.
			defaultWatch?: undefined;
			watch: number;
			onChange?: (watch: number) => void;
	  }
	| {
			defaultWatch: number;
			watch?: undefined;
			onChange?: undefined;
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

const WatchBlock = memo(
	({ className, defaultWatch, onChange, pid, watch }: Props) => {
		const { numWatchColors } = useLocalPartial(["numWatchColors"]);

		const [localWatch, setLocalWatch] = useState(defaultWatch ?? 0);
		const actualWatch = watch ?? localWatch;

		const handleClick = async (event: SyntheticEvent) => {
			event.preventDefault();
			const newWatch = (actualWatch + 1) % (numWatchColors + 1);

			// Update locally first, both for responsiveness and so it works in exhibition games
			setLocalWatch(newWatch);
			if (onChange) {
				onChange(newWatch);
			}

			await toWorker("main", "updatePlayerWatch", { pid, watch: newWatch });
		};

		useEffect(() => {
			if (defaultWatch !== undefined) {
				// Need to listen for bulk action updates
				const unbind = crossTabEmitter.on("updateWatch", async (watchByPid) => {
					const newWatch = watchByPid[pid];
					if (newWatch !== undefined) {
						setLocalWatch(newWatch);
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
	},
);

export default WatchBlock;
