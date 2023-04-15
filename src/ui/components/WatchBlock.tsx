import classNames from "classnames";
import { memo, type SyntheticEvent } from "react";
import { toWorker, useLocalPartial } from "../util";

type Props = {
	className?: string;
	pid: number;
	watch: number;

	// Not needed if you pass watch down all the way from a worker view, only needed if you're handling it in the UI only
	onChange?: (watch: number) => void;
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

	if (watch > 0) {
		return (
			<span
				className={classNames(
					`glyphicon glyphicon-flag watch watch-active-${watch}`,
					className,
				)}
				onClick={handleClick}
				title={
					numWatchColors > 1 ? "Cycle Watch List" : "Remove from Watch List"
				}
			/>
		);
	}

	return (
		<span
			className={classNames("glyphicon glyphicon-flag watch", className)}
			onClick={handleClick}
			title="Add to Watch List"
		/>
	);
});

export default WatchBlock;
