import classNames from "classnames";
import { useEffect } from "react";
import { Dropdown } from "react-bootstrap";

const PlayPauseNext = ({
	className,
	disabled,
	fastForwardAlignRight,
	fastForwards,
	onPlay,
	onPause,
	onNext,
	paused,
	titlePlay = "Play",
	titlePause = "Pause",
	titleNext = "Next",
}: {
	className?: string;
	disabled?: boolean;
	fastForwardAlignRight?: boolean;
	fastForwards?: {
		key?: string;
		onClick: () => void;
		label: string;
	}[];
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	paused: boolean;
	titlePlay?: string;
	titlePause?: string;
	titleNext?: string;
}) => {
	useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			// alt + letter
			if (
				!disabled &&
				event.altKey &&
				!event.ctrlKey &&
				!event.shiftKey &&
				!event.isComposing &&
				!event.metaKey
			) {
				const key = event.key.toLowerCase();
				if (paused) {
					const option = fastForwards?.find(option2 => option2.key === key);

					if (option) {
						option.onClick();
					} else if (key === "b") {
						onPlay();
					} else if (key === "n") {
						onNext();
					}
				} else {
					if (key === "b") {
						onPause();
					}
				}
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [fastForwards, disabled, onPause, onNext, onPlay, paused]);

	return (
		<div className={classNames("btn-group", className)}>
			{paused ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPlay}
					title={`${titlePlay} (Alt+B)`}
				>
					<span className="glyphicon glyphicon-play" />
				</button>
			) : (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPause}
					title={`${titlePause} (Alt+B)`}
				>
					<span className="glyphicon glyphicon-pause" />
				</button>
			)}
			<button
				className="btn btn-light-bordered"
				disabled={disabled || !paused}
				onClick={onNext}
				title={`${titleNext} (Alt+N)`}
			>
				<span className="glyphicon glyphicon-step-forward" />
			</button>
			{fastForwards ? (
				<Dropdown align={fastForwardAlignRight ? "end" : undefined}>
					<Dropdown.Toggle
						id="fast-forward"
						className="btn-light-bordered fast-forward"
						disabled={disabled || !paused}
						variant={"no-class" as any}
						title="Fast Forward"
					>
						<span className="glyphicon glyphicon-fast-forward" />
					</Dropdown.Toggle>
					<Dropdown.Menu>
						{fastForwards.map((item, i) => (
							<Dropdown.Item
								key={i}
								onClick={item.onClick}
								className="kbd-parent"
							>
								{item.label}
								{item.key ? (
									<span className="text-muted kbd">
										Alt+{item.key.toUpperCase()}
									</span>
								) : null}
							</Dropdown.Item>
						))}
					</Dropdown.Menu>
				</Dropdown>
			) : null}
		</div>
	);
};

export default PlayPauseNext;
