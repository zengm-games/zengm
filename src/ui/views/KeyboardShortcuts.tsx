import fastDeepEqual from "fast-deep-equal";
import { useEffect, useRef, useState } from "react";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { helpers, logEvent, toWorker } from "../util/index.ts";
import type { View } from "../../common/types.ts";
import { MoreLinks } from "../components/index.tsx";
import {
	formatKeyboardShortcutRaw,
	keyboardShortcuts,
	type KeyboardShortcutCategories,
	type KeyboardShortcutInfo,
} from "../hooks/useKeyboardShortcuts.ts";
import clsx from "clsx";
import Modal from "../components/Modal.tsx";

type ShortcutOrNull = KeyboardShortcutInfo["shortcut"] | null;

const KeyboardShortcutModal = ({
	cancel,
	save,
	initialShortcut,
	categoryAndAction,
}: {
	cancel: () => void;
	categoryAndAction: [KeyboardShortcutCategories, string] | undefined;
	save: (shortcut: ShortcutOrNull) => void;
	initialShortcut: ShortcutOrNull;
}) => {
	const [shortcut, setShortcut] = useState(initialShortcut);

	const category = categoryAndAction?.[0];
	const action = categoryAndAction?.[1];

	useEffect(() => {
		setShortcut(initialShortcut);
	}, [initialShortcut, category, action]);

	const show = categoryAndAction !== undefined;

	const modalRef = useRef<{
		dialog: HTMLDivElement;
	} | null>(null);

	useEffect(() => {
		if (!show) {
			return;
		}

		const modalElement = modalRef.current?.dialog;
		if (!modalElement) {
			return;
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}

			if (
				event.key === "Enter" &&
				!event.altKey &&
				!event.shiftKey &&
				!event.ctrlKey &&
				!event.metaKey
			) {
				save(shortcut);
			}

			// Prevent default browser shortcuts from running
			event.preventDefault();

			// Prevent other ZenGM shortcuts from running, like ctrl+k
			event.stopPropagation();

			setShortcut({
				altKey: event.altKey,
				shiftKey: event.shiftKey,
				ctrlKey: event.ctrlKey,
				metaKey: event.metaKey,
				key: event.key,
			});
		};

		modalElement.addEventListener("keydown", handleKeydown);
		return () => {
			modalElement.removeEventListener("keydown", handleKeydown);
		};
	}, [save, shortcut, show]);

	return (
		<Modal animation show={show} onHide={cancel} ref={modalRef}>
			<Modal.Body>
				<div className="text-center mb-3">
					Press the desired key combination and then press ENTER
				</div>
				<div className="text-center fw-bold">
					{formatKeyboardShortcutRaw(shortcut)}
				</div>
			</Modal.Body>
			<Modal.Footer>
				<button className="btn btn-secondary" onClick={cancel}>
					Cancel
				</button>
				<button
					className="btn btn-primary"
					onClick={() => {
						save(shortcut);
					}}
				>
					Save
				</button>
			</Modal.Footer>
		</Modal>
	);
};

const KeyboardShortcuts = ({
	keyboardShortcutsLocal,
}: View<"keyboardShortcuts">) => {
	const categories = {
		playMenu: "Play menu",
		playPauseNext: "Play/pause/next",
		commandPallete: "Command pallete",
		boxScore: "Box score",
	};

	const [keyboardShortcutsEdited, setKeyboardShortcutsEdited] = useState(
		keyboardShortcutsLocal ?? {},
	);

	const setAndSaveKeyboardShortcutsEdited = async (
		newShortcuts: typeof keyboardShortcutsEdited,
	) => {
		setKeyboardShortcutsEdited(newShortcuts);

		// Remove any that are equal to the defaults
		const pruned: typeof newShortcuts = {};
		for (const category of helpers.keys(newShortcuts)) {
			const shortcuts = newShortcuts[category];
			if (shortcuts) {
				for (const [action, shortcut] of Object.entries(shortcuts)) {
					if (shortcut !== undefined) {
						const defaultInfo = (keyboardShortcuts as any)[category][
							action
						] as KeyboardShortcutInfo;
						if (!fastDeepEqual(shortcut, defaultInfo.shortcut)) {
							if (!pruned[category]) {
								pruned[category] = {};
							}
							(pruned[category] as any)[action] = shortcut;
						}
					}
				}
			}
		}

		try {
			await toWorker("main", "updateKeyboardShortcuts", pruned);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
				persistent: true,
			});
		}
	};

	const [edit, setEdit] = useState<
		[KeyboardShortcutCategories, string] | undefined
	>(undefined);
	const [editShortcut, setEditShortcut] = useState<ShortcutOrNull>(null);

	useTitleBar({ title: "Keyboard Shortcuts" });

	return (
		<>
			<MoreLinks type="globalSettings" page="/settings/keyboard" />

			<form>
				<div className="d-flex flex-column gap-3">
					{helpers.keys(categories).map((key) => {
						const category = keyboardShortcuts[key];
						const actions = helpers.keys(category);

						return (
							<div key={key}>
								<h2>{categories[key]}</h2>
								<div className="d-flex flex-column gap-2">
									{actions.map((action, i) => {
										const info = category[action] as KeyboardShortcutInfo;
										if (!info.customizable) {
											return;
										}

										let shortcut = keyboardShortcutsEdited?.[key]?.[action] as
											| ShortcutOrNull
											| undefined;
										let edited = true;
										if (shortcut === undefined) {
											shortcut = info.shortcut;
											edited = false;
										} else if (fastDeepEqual(shortcut, info.shortcut)) {
											edited = false;
										}

										return (
											<div
												className={clsx(
													"d-flex",
													edited ? "text-info" : undefined,
												)}
												key={action}
											>
												<div
													className="d-flex align-items-center"
													style={{ width: 200 }}
												>
													{info.name}
												</div>
												<div
													className="d-flex align-items-center"
													style={{ width: 120 }}
												>
													{formatKeyboardShortcutRaw(shortcut)}
												</div>
												<div className="d-flex align-items-center">
													<button
														className="btn btn-secondary"
														type="button"
														onClick={() => {
															setEdit([key, action]);
															setEditShortcut(shortcut);
														}}
													>
														Edit
													</button>
													{edited ? (
														<button
															className="btn btn-danger ms-2"
															type="button"
															onClick={() => {
																setAndSaveKeyboardShortcutsEdited({
																	...keyboardShortcutsEdited,
																	[key]: {
																		...keyboardShortcutsEdited[key],
																		[action]: undefined,
																	},
																});
															}}
														>
															Reset
														</button>
													) : null}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>

				<button
					className="btn btn-danger mt-3"
					type="button"
					disabled={Object.keys(keyboardShortcutsEdited).length === 0}
					onClick={() => {
						setAndSaveKeyboardShortcutsEdited({});
					}}
				>
					Reset all
				</button>
			</form>

			<KeyboardShortcutModal
				categoryAndAction={edit}
				cancel={() => {
					setEdit(undefined);
				}}
				save={(shortcut) => {
					if (edit) {
						const [category, action] = edit;
						setAndSaveKeyboardShortcutsEdited({
							...keyboardShortcutsEdited,
							[category]: {
								...keyboardShortcutsEdited[category],
								[action]: shortcut,
							},
						});
						setEdit(undefined);
						setEditShortcut(shortcut); // So it doesn't flicker as animating out
					}
				}}
				initialShortcut={editShortcut}
			/>
		</>
	);
};

export default KeyboardShortcuts;
