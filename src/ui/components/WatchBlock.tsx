import clsx from "clsx";
import { memo, type SyntheticEvent } from "react";
import { toWorker, useLocalPartial } from "../util";

type Props = {
	className?: string;
	pid: number;
	watch: number;

	// Not needed if you pass watch down all the way from a worker view, only needed if you're handling it in the UI only
	onChange?: (watch: number) => void;
};

export const Flag = ({
	className,
	watch,
	onClick,
	title,
}: {
	className?: string;
	watch: number;
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

const WatchBlock = memo(({ className, onChange, pid, watch }: Props) => {
	const { numWatchColors } = useLocalPartial(["numWatchColors"]);

	const handleClick = async (event: SyntheticEvent) => {
		event.preventDefault();
		const newWatch = (watch + 1) % (numWatchColors + 1);
		if (onChange) {
			onChange(newWatch);
		}
		await toWorker("main", "updatePlayerWatch", { pid, watch: newWatch });
	};

	return (
		<Flag
			className={className}
			onClick={handleClick}
			title={
				watch !== undefined && watch > 0
					? numWatchColors > 1
						? "Cycle Watch List"
						: "Remove from Watch List"
					: "Add to Watch List"
			}
			watch={watch}
		/>
	);
});

export default WatchBlock;
