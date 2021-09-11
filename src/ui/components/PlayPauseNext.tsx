import classNames from "classnames";
import { Dropdown } from "react-bootstrap";

const PlayPauseNext = ({
	className,
	disabled,
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
	return (
		<div className={classNames("btn-group", className)}>
			{paused ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPlay}
					title={titlePlay}
				>
					<span className="glyphicon glyphicon-play" />
				</button>
			) : (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPause}
					title={titlePause}
				>
					<span className="glyphicon glyphicon-pause" />
				</button>
			)}
			<button
				className="btn btn-light-bordered"
				disabled={disabled || !paused}
				onClick={onNext}
				title={titleNext}
			>
				<span className="glyphicon glyphicon-step-forward" />
			</button>
			{fastForwards ? (
				<Dropdown alignRight>
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
									<span className="text-muted kbd">Alt+{item.key}</span>
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
