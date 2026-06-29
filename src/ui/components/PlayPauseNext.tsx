import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	formatKeyboardShortcut,
	useKeyboardShortcuts,
	type KeyboardShortcuts,
} from "../util/keyboardShortcuts.ts";
import { useLocal } from "../util/local.ts";
import { Icon } from "./Icon.tsx";

export type FastForward = {
	keyboardShortcut?: Exclude<
		keyof KeyboardShortcuts["playPauseNext"],
		"next" | "playPause"
	>;
	onClick: () => void;
	label: string;
};

export const PlayPauseNext = ({
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
	useKeyboardShortcuts({
		category: "playPauseNext",
		callback: useCallback(
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
	});

	const { keyboardShortcuts: keyboardShortcutsLocal } = useLocal([
		"keyboardShortcuts",
	]);
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

	const [ffOpen, setFfOpen] = useState(false);
	const ffRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!ffOpen) {
			return;
		}
		const handler = (e: MouseEvent) => {
			if (ffRef.current && !ffRef.current.contains(e.target as Node)) {
				setFfOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [ffOpen]);

	return (
		<div className={clsx("btn-group", className)}>
			{paused ? (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPlay}
					title={`${titlePlay}${formattedShortcutPlayPause !== undefined ? ` (${formattedShortcutPlayPause})` : ""}`}
				>
					<Icon name="play" />
				</button>
			) : (
				<button
					className="btn btn-light-bordered"
					disabled={disabled}
					onClick={onPause}
					title={`${titlePause}${formattedShortcutPlayPause !== undefined ? ` (${formattedShortcutPlayPause})` : ""}`}
				>
					<Icon name="pause" />
				</button>
			)}
			<button
				className="btn btn-light-bordered"
				disabled={disabled || !paused}
				onClick={onNext}
				title={`${titleNext}${formattedShortcutNext !== undefined ? ` (${formattedShortcutNext})` : ""}`}
			>
				<Icon name="stepForward" />
			</button>
			{fastForwards ? (
				<div ref={ffRef} className="dropdown">
					<button
						id="fast-forward"
						className="btn btn-light-bordered fast-forward"
						disabled={disabled || !paused || fastForwards.length === 0}
						onClick={() => setFfOpen((o) => !o)}
						title="Fast Forward"
						type="button"
					>
						<Icon name="fastForward" />
					</button>
					{ffOpen ? (
						<ul
							className={clsx(
								"dropdown-menu",
								"show",
								fastForwardAlignRight && "dropdown-menu-end",
							)}
						>
							{fastForwards.map((item, i) => (
								<li key={i}>
									<button
										className="dropdown-item kbd-parent"
										onClick={() => {
											item.onClick();
											setFfOpen(false);
										}}
										type="button"
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
									</button>
								</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}
		</div>
	);
};
