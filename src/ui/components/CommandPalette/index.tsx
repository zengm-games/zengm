import { matchSorter } from "match-sorter";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { groupBy } from "../../../common/groupBy";
import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../../common/types";
import {
	menuItems,
	realtimeUpdate,
	useLocal,
	useLocalShallow,
} from "../../util";
import { getText, makeAnchorProps } from "../SideBar";

const useCommandPalette = () => {
	const [show, setShow] = useState(true);

	useEffect(() => {
		if (window.mobile) {
			return;
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (event.altKey || event.shiftKey || event.isComposing) {
				return;
			}

			if (event.code === "KeyK" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setShow(current => !current);
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, []);
	const [searchText, setSearchText] = useState("");
	const [mode, setMode] = useState<undefined | Mode>();

	const [activeIndex, setActiveIndex] = useState<number | undefined>();

	const onHide = useCallback(() => {
		setShow(false);
		setSearchText("");
		setMode(undefined);
		setActiveIndex(undefined);
	}, []);

	return {
		show,
		onHide,
		searchText,
		setSearchText,
		mode,
		setMode,
		activeIndex,
		setActiveIndex,
	};
};

const MODES: { key: "@" | "/" | "!"; description: string }[] = [
	{
		key: "@",
		description: "players",
	},
	{
		key: "!",
		description: "teams",
	},
	{
		key: "/",
		description: "leagues",
	},
];
type Mode = typeof MODES[number];

const getResultsGrouped = ({
	godMode,
	inLeague,
	onHide,
	searchText,
}: {
	godMode: boolean;
	inLeague: boolean;
	onHide: () => void;
	searchText: string;
}) => {
	const filterMenuItem = (menuItem: MenuItemLink | MenuItemText) => {
		if (menuItem.type === "text") {
			return false;
		}

		if (!menuItem.league && inLeague) {
			return false;
		}

		if (!menuItem.nonLeague && !inLeague) {
			return false;
		}

		if (menuItem.godMode && !godMode) {
			return false;
		}

		return true;
	};

	const flat = menuItems.filter(
		menuItem => menuItem.type === "link",
	) as MenuItemLink[];
	const nested = menuItems.filter(
		menuItem => menuItem.type === "header",
	) as MenuItemHeader[];

	const results = [
		...flat.filter(filterMenuItem).map(menuItem => {
			return {
				category: "",
				menuItem,
			};
		}),
		...nested.map(header => {
			return (header.children.filter(filterMenuItem) as MenuItemLink[]).map(
				menuItem => {
					return {
						category: header.long,
						menuItem,
					};
				},
			);
		}),
	]
		.flat()
		.map(({ category, menuItem }) => {
			const anchorProps = makeAnchorProps(menuItem, onHide, true);
			const text = getText(menuItem.text);
			const search = category ? `${category} ${text}` : text;

			return {
				category,
				text,
				search,
				anchorProps,
			};
		});

	let count = 0;
	const output = [];
	if (searchText === "") {
		// No search - return groups
		const resultsGrouped = groupBy(results, "category");
		for (const category of Object.keys(resultsGrouped)) {
			if (resultsGrouped[category]) {
				count += resultsGrouped[category].length;
				output.push({
					category,
					results: resultsGrouped[category],
				});
			}
		}
	} else {
		// Search - return sorted by relevance, no grouping
		const filteredResults = matchSorter(results, searchText, {
			keys: ["search"],
		});
		if (filteredResults.length > 0) {
			output.push({
				category: "",
				results: filteredResults,
			});
			count = filteredResults.length;
		}
	}

	return {
		resultsGrouped: output,
		count,
	};
};

const ACTIVE_CLASS = "table-bg-striped";

const SearchResults = ({
	activeIndex,
	collapseGroups,
	resultsGrouped,
}: {
	activeIndex: number | undefined;
	collapseGroups: boolean;
	resultsGrouped: ReturnType<typeof getResultsGrouped>["resultsGrouped"];
}) => {
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	// Keep active element in viewport
	useEffect(() => {
		if (activeIndex !== undefined && wrapperRef.current) {
			const activeElement = wrapperRef.current.querySelector(
				`.${ACTIVE_CLASS}`,
			);
			if (activeElement) {
				activeElement.scrollIntoView({
					block: "nearest",
				});
			}
		}
	}, [activeIndex, resultsGrouped]);

	let index = 0;
	return (
		<div ref={wrapperRef}>
			{resultsGrouped.map(({ category, results }, i) => {
				const block = (
					<div
						key={category}
						className={`card border-0${i > 0 ? " pt-2 mt-2 border-top" : ""}`}
					>
						{!collapseGroups && category ? (
							<div className="card-header bg-transparent border-0">
								<span className="fw-bold text-secondary text-uppercase">
									{category}
								</span>
							</div>
						) : null}
						<div className="list-group list-group-flush rounded-0">
							{results.map((result, j) => {
								const active = activeIndex === index;
								index += 1;

								return (
									<a
										key={j}
										{...result.anchorProps}
										className={`d-flex cursor-pointer list-group-item list-group-item-action border-0 ${
											active ? ACTIVE_CLASS : ""
										}`}
									>
										{collapseGroups && result.category ? (
											<>{result.category} &gt; </>
										) : null}
										{result.text}

										{active ? (
											<div className="ms-auto">Press enter to select</div>
										) : null}
									</a>
								);
							})}
						</div>
					</div>
				);

				return block;
			})}
		</div>
	);
};

const ModeText = ({ inLeague }: { inLeague: boolean }) => {
	// Hide players/teams in league
	const modes = MODES.filter(mode => inLeague || mode.key === "/");

	return (
		<>
			Type{" "}
			{modes.map((mode, i) => (
				<Fragment key={mode.key}>
					{i === 0 ? null : i === modes.length - 1 ? ", or " : ", "}
					<span className="text-black">{mode.key}</span> to search{" "}
					{mode.description}
				</Fragment>
			))}
			.
		</>
	);
};

const ComandPalette = () => {
	const {
		show,
		onHide,
		searchText,
		setSearchText,
		mode,
		setMode,
		activeIndex,
		setActiveIndex,
	} = useCommandPalette();
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	const { godMode, lid } = useLocalShallow(state => ({
		godMode: state.godMode,
		lid: state.lid,
	}));
	const inLeague = lid !== undefined;

	useEffect(() => {
		if (show && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [show]);

	const { resultsGrouped, count } = getResultsGrouped({
		godMode,
		inLeague,
		onHide,
		searchText,
	});

	useEffect(() => {
		if (window.mobile || !show) {
			return;
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				event.isComposing
			) {
				return;
			}

			if (event.code === "ArrowDown") {
				setActiveIndex(index => {
					if (index === undefined) {
						return 0;
					}

					if (index + 1 >= count) {
						return 0;
					}

					return index + 1;
				});
			} else if (event.code === "ArrowUp") {
				setActiveIndex(index => {
					if (index === undefined) {
						return 0;
					}

					if (index - 1 < 0) {
						return count - 1;
					}

					return index - 1;
				});
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [count, setActiveIndex, show]);

	if (!show) {
		return null;
	}

	return (
		<Modal animation={false} show={show} onHide={onHide} scrollable>
			<Modal.Header className="ps-3 pe-0 py-1">
				<span
					className="glyphicon glyphicon-search"
					style={{
						paddingBottom: 2,
					}}
				></span>
				<form
					className="flex-grow-1"
					onSubmit={event => {
						event.preventDefault();

						if (activeIndex !== undefined) {
							let index = 0;
							for (const group of resultsGrouped) {
								for (const result of group.results) {
									if (index === activeIndex) {
										if (result.anchorProps.onClick) {
											(result.anchorProps.onClick as any)();
										}

										if (result.anchorProps.href) {
											if (result.anchorProps.target) {
												window.open(result.anchorProps.href);
											} else {
												realtimeUpdate([], result.anchorProps.href);
											}
										}

										return;
									}
									index += 1;
								}
							}
						}
					}}
				>
					<div className="input-group ps-1">
						{mode ? (
							<span
								className="input-group-text px-1 border-0 rounded-3 justify-content-center"
								style={{ minWidth: 21 }}
							>
								{mode.key}
							</span>
						) : null}
						<input
							ref={searchInputRef}
							className="form-control shadow-none border-0 ps-1 pe-0"
							type="text"
							placeholder={`Search ${mode?.description ?? "pages"}...`}
							style={{
								fontSize: 15,
							}}
							value={searchText}
							onChange={event => {
								const newText = event.target.value;

								if (!mode && newText.length > 0) {
									const newMode = MODES.find(mode => mode.key === newText[0]);
									if (newMode) {
										setMode(newMode);
										setSearchText(newText.slice(1));
										setActiveIndex(newText.length > 1 ? 0 : undefined);
										return;
									}
								}

								setSearchText(newText);
								setActiveIndex(newText.length > 0 ? 0 : undefined);
							}}
							onKeyDown={event => {
								// Handle backspace when mode is set and there is no text - unset mode
								if (searchText === "" && mode && event.code === "Backspace") {
									setMode(undefined);
									setActiveIndex(undefined);
								}
							}}
						/>
					</div>
				</form>
			</Modal.Header>

			<Modal.Body className="py-2 px-0">
				{searchText === "" && !mode ? (
					<p className="text-muted px-3 pb-2 mb-2 border-bottom">
						<ModeText inLeague={inLeague} />
					</p>
				) : null}

				{resultsGrouped.length > 0 ? (
					<SearchResults
						activeIndex={activeIndex}
						collapseGroups={searchText !== ""}
						resultsGrouped={resultsGrouped}
					/>
				) : (
					<div className="px-3">No results found.</div>
				)}
			</Modal.Body>
		</Modal>
	);
};

export default ComandPalette;
