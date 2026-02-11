import clsx from "clsx";
import { useCallback } from "react";
import { Dropdown } from "react-bootstrap";
import {
	formatKeyboardShortcut,
	useKeyboardShortcuts,
	type KeyboardShortcuts,
} from "../hooks/useKeyboardShortcuts.ts";
import { useLocal } from "../util/index.ts";

export type FastForward = {
	keyboardShortcut?: Exclude<
		keyof KeyboardShortcuts["playPauseNext"],
		"next" | "playPause"
	>;
	onClick: () => void;
	label: string;
};

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
	ignoreKeyboardShortcuts,
}: {
	className?: string;
	disabled?: boolean;
	fastForwardAlignRight?: boolean;
	fastForwards?: FastForward[];
	onPlay: () => void;
	onPause: () => void;
	onNext: () => void;
	paused: boolean;
	titlePlay?: string;
	titlePause?: string;
	titleNext?: string;
	ignoreKeyboardShortcuts?: boolean;
}) => {
	useKeyboardShortcuts(
		"playPauseNext",
		undefined,
		useCallback(
			(action) => {
				if (!ignoreKeyboardShortcuts && !disabled) {
					if (paused) {
						const option = fastForwards?.find(
							(option2) => option2.keyboardShortcut === action,
						);

						if (option) {
							option.onClick();
						} else if (action === "playPause") {
							onPlay();
						} else if (action === "next") {
							onNext();
						}
					} else {
						if (action === "playPause") {
							onPause();
						}
					}
				}
			},
			[
				fastForwards,
				disabled,
				ignoreKeyboardShortcuts,
				onPause,
				onNext,
				onPlay,
				paused,
			],
		),
	);

	const keyboardShortcutsLocal = useLocal((state) => state.keyboardShortcuts);
	const formattedShortcutPlayPause = formatKeyboardShortcut(
		"playPauseNext",
		"playPause",
		keyboardShortcutsLocal,
	);
	const formattedShortcutNext = formatKeyboardShortcut(
		"playPauseNext",
		"next",
		keyboardShortcutsLocal,
	);

	return (
		<div className={clsx("btn-group", className)}>
			{paused ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPlay}
					title={`${titlePlay}${formattedShortcutPlayPause !== undefined ? ` (${formattedShortcutPlayPause})` : ""}`}
				>
					<span className="glyphicon glyphicon-play" />
				</button>
			) : (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPause}
					title={`${titlePause}${formattedShortcutPlayPause !== undefined ? ` (${formattedShortcutPlayPause})` : ""}`}
				>
					<span className="glyphicon glyphicon-pause" />
				</button>
			)}
			<button
				className="btn btn-light-bordered"
				disabled={disabled || !paused}
				onClick={onNext}
				title={`${titleNext}${formattedShortcutNext !== undefined ? ` (${formattedShortcutNext})` : ""}`}
			>
				<span className="glyphicon glyphicon-step-forward" />
			</button>
			{fastForwards ? (
				<Dropdown align={fastForwardAlignRight ? "end" : undefined}>
					<Dropdown.Toggle
						id="fast-forward"
						className="btn-light-bordered fast-forward"
						disabled={disabled || !paused || fastForwards.length === 0}
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
								{item.keyboardShortcut ? (
									<span className="text-body-secondary kbd">
										{formatKeyboardShortcut(
											"playPauseNext",
											item.keyboardShortcut,
											keyboardShortcutsLocal,
										)}
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
