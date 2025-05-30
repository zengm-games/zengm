import ago from "s-ago";
import { matchSorter } from "match-sorter";
import {
	Fragment,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { groupBy, orderBy } from "../../../common/utils.ts";
import type {
	LocalStateUI,
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../../common/types.ts";
import {
	helpers,
	logEvent,
	menuItems,
	realtimeUpdate,
	safeLocalStorage,
	toWorker,
	useLocalPartial,
} from "../../util/index.ts";
import { getText, makeAnchorProps } from "../SideBar.tsx";
import {
	SPORT_HAS_LEGENDS,
	SPORT_HAS_REAL_PLAYERS,
} from "../../../common/index.ts";
import Modal from "../Modal.tsx";
import { normalizeIntl } from "../../../common/normalizeIntl.ts";

const TWO_MONTHS_IN_MILLISECONDS = 2 * 30 * 24 * 60 * 60 * 1000;
const ONE_WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

const saveLastUsed = (init?: boolean) => {
	let now = Date.now();

	// If init, set it up so notification will show in a week
	if (init) {
		now = now - TWO_MONTHS_IN_MILLISECONDS + ONE_WEEK_IN_MILLISECONDS;
	}

	safeLocalStorage.setItem("commandPaletteLastUsed", String(now));
};

const useCommandPalette = () => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.altKey || event.shiftKey || event.isComposing) {
				return;
			}

			if (event.code === "KeyK" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
				setShow((current) => !current);
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, []);

	const onHide = useCallback(() => {
		setShow(false);
	}, []);

	return {
		show,
		onHide,
	};
};

const MODES: { key: "@" | "/" | "!"; description: string }[] = [
	{
		key: "@",
		description: "players",
	},
	{
		key: "/",
		description: "teams",
	},
	{
		key: "!",
		description: "leagues",
	},
];
type Mode = (typeof MODES)[number];

// Tiebreaker - original sort order, rather than alphabetical (default)
const baseSort = () => 0;

const getResultsGroupedDefault = ({
	godMode,
	inLeague,
	onHide,
	playMenuOptions,
	searchText,
}: {
	godMode: boolean;
	inLeague: boolean;
	onHide: () => void;
	playMenuOptions: LocalStateUI["playMenuOptions"];
	searchText: string;
}) => {
	const filterMenuItem = (menuItem: MenuItemLink | MenuItemText) => {
		if (menuItem.type === "text") {
			return false;
		}

		if (!menuItem.commandPalette) {
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
		(menuItem) => menuItem.type === "link",
	) as MenuItemLink[];
	const nested = menuItems.filter(
		(menuItem) => menuItem.type === "header",
	) as MenuItemHeader[];

	const results = [
		...flat.filter(filterMenuItem).map((menuItem) => {
			return {
				category: "",
				menuItem,
			};
		}),
		...nested.map((header) => {
			return (header.children.filter(filterMenuItem) as MenuItemLink[]).map(
				(menuItem) => {
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
			const prefix =
				menuItem.prefix ??
				(menuItem.godMode ? (
					<span className="legend-square god-mode me-1" />
				) : undefined);

			const search = category ? `${category} ${text}` : text;

			if (typeof text !== "string") {
				throw new Error("Should never happen");
			}

			return {
				category,
				prefix,
				text,
				search,
				anchorProps,
			};
		});

	results.unshift(
		...playMenuOptions.map((option) => ({
			category: "Play",
			prefix: undefined,
			text: option.label,
			search: `Play ${option.label}`,
			anchorProps: {
				href: option.url,
				onClick: () => {
					onHide();
					if (!option.url) {
						toWorker("playMenu", option.id as any, undefined);
					}
				},
			} as AnchorProps,
		})),
	);

	const output = [];
	if (searchText === "") {
		// No search - return groups
		const resultsGrouped = groupBy(results, "category");
		for (const category of Object.keys(resultsGrouped)) {
			if (resultsGrouped[category]) {
				output.push({
					category: category === "undefined" ? undefined : category,
					results: resultsGrouped[category],
				});
			}
		}
	} else {
		// Search - return sorted by relevance, no grouping
		const filteredResults = matchSorter(results, searchText, {
			keys: ["search"],
			baseSort,
		});
		if (filteredResults.length > 0) {
			output.push({
				category: "",
				results: filteredResults,
			});
		}
	}

	return output;
};

type AnchorProps = ReturnType<typeof makeAnchorProps>;

const getResultsGroupedTeams = ({
	hideDisabledTeams,
	onHide,
	searchText,
	teamInfoCache,
}: {
	hideDisabledTeams: LocalStateUI["hideDisabledTeams"];
	onHide: () => void;
	searchText: string;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	const teamInfos = teamInfoCache
		.map((t, tid) => ({
			text: `${t.region} ${t.name} (${t.abbrev}${
				t.disabled ? ", disabled" : ""
			})`,
			disabled: t.disabled,
			anchorProps: {
				href: helpers.leagueUrl(["roster", `${t.abbrev}_${tid}`]),
				onClick: onHide,
			} as AnchorProps,
		}))
		.filter((t) => !hideDisabledTeams || !t.disabled);

	const filteredResults = matchSorter(teamInfos, searchText, {
		keys: ["text"],
		baseSort,
	});

	return [
		{
			category: "",
			results: filteredResults.map((t) => ({
				category: "",
				text: t.text,
				anchorProps: t.anchorProps,
			})),
		},
	];
};

const getResultsGroupedLeagues = async ({
	onHide,
	searchText,
}: {
	onHide: () => void;
	searchText: string;
}) => {
	const leagues = await toWorker("main", "getLeagues", undefined);

	const newLeagueResults = [];
	if (SPORT_HAS_REAL_PLAYERS) {
		newLeagueResults.push(
			{
				text: "New League - Real Players",
				href: "/new_league/real",
			},
			{
				text: "New League - Random Players",
				href: "/new_league/random",
			},
		);

		if (SPORT_HAS_LEGENDS) {
			newLeagueResults.push({
				text: "New League - Legends",
				href: "/new_league/legends",
			});
		}

		newLeagueResults.push({
			text: "New League - Custom",
			href: "/new_league",
		});
	} else {
		newLeagueResults.push({
			text: "New League",
			href: "/new_league",
		});
	}

	const results = [
		{
			category: undefined,
			text: "Switch League",
			anchorProps: {
				href: "/",
				onClick: onHide,
			} as AnchorProps,
		},
		...newLeagueResults.map((row) => ({
			category: undefined,
			text: row.text,
			anchorProps: {
				href: row.href,
				onClick: onHide,
			} as AnchorProps,
		})),
		...orderBy(leagues, "lastPlayed", "desc").map((l) => {
			const lastPlayed = `last played ${
				l.lastPlayed ? ago(l.lastPlayed) : "???"
			}`;
			return {
				category: "Leagues",
				text: [
					`${l.name} - ${lastPlayed}`,
					`${l.phaseText} - ${l.teamRegion} ${l.teamName}`,
				],
				search: `${l.name} - ${lastPlayed} ${l.phaseText} - ${l.teamRegion} ${l.teamName}`,
				anchorProps: {
					href: `/l/${l.lid}`,
					onClick: onHide,
				} as AnchorProps,
			};
		}),
	];

	const output = [];
	if (searchText === "") {
		// No search - return groups
		const resultsGrouped = groupBy(results, "category");
		for (const category of Object.keys(resultsGrouped)) {
			if (resultsGrouped[category]) {
				output.push({
					category: category === "undefined" ? undefined : category,
					results: resultsGrouped[category],
				});
			}
		}
	} else {
		// Search - return sorted by relevance, no grouping
		const filteredResults = matchSorter(results, searchText, {
			keys: [(row) => (row as any).search ?? row.text],
			baseSort,
		});
		if (filteredResults.length > 0) {
			output.push({
				results: filteredResults.map((row) => ({
					category: row.category,
					text: row.text,
					anchorProps: row.anchorProps,
					hideCollapsedCategory: true,
				})),
			});
		}
	}

	return output;
};

const getResultsGroupedPlayers = async ({
	challengeNoRatings,
	onHide,
	searchText,
}: {
	challengeNoRatings: LocalStateUI["challengeNoRatings"];
	onHide: () => void;
	searchText: string;
}) => {
	const players = await toWorker("main", "getPlayersCommandPalette", undefined);

	const playerInfos = orderBy(players, ["lastName", "firstName", "abbrev"]).map(
		(p) => {
			return {
				text: `${p.firstName} ${p.lastName} - ${p.abbrev}, ${p.ratings.pos}, ${
					p.age
				}yo${
					!challengeNoRatings
						? ` - ${p.ratings.ovr} ovr, ${p.ratings.pot} pot`
						: ""
				}`,
				anchorProps: {
					href: helpers.leagueUrl(["player", p.pid]),
					onClick: onHide,
				} as AnchorProps,
			};
		},
	);

	const filteredResults = matchSorter(playerInfos, searchText, {
		keys: ["text"],
		baseSort,
	});

	return [
		{
			results: filteredResults.map((row) => ({
				text: row.text,
				anchorProps: row.anchorProps,
			})),
		},
	];
};

const getResultsGrouped = async ({
	challengeNoRatings,
	godMode,
	hideDisabledTeams,
	inLeague,
	mode,
	onHide,
	playMenuOptions,
	searchText,
	teamInfoCache,
}: {
	challengeNoRatings: LocalStateUI["challengeNoRatings"];
	godMode: boolean;
	hideDisabledTeams: LocalStateUI["hideDisabledTeams"];
	inLeague: boolean;
	mode: Mode | undefined;
	onHide: () => void;
	playMenuOptions: LocalStateUI["playMenuOptions"];
	searchText: string;
	teamInfoCache: LocalStateUI["teamInfoCache"];
}) => {
	let resultsGrouped: {
		category?: string;
		results: {
			anchorProps: AnchorProps;
			category?: string;
			text: string | string[];
			prefix?: ReactNode;
		}[];
	}[];
	if (mode?.key === "/") {
		resultsGrouped = getResultsGroupedTeams({
			hideDisabledTeams,
			onHide,
			searchText,
			teamInfoCache,
		});
	} else if (mode?.key === "!") {
		resultsGrouped = await getResultsGroupedLeagues({
			onHide,
			searchText,
		});
	} else if (mode?.key === "@") {
		resultsGrouped = await getResultsGroupedPlayers({
			challengeNoRatings,
			onHide,
			searchText,
		});
	} else {
		resultsGrouped = getResultsGroupedDefault({
			godMode,
			inLeague,
			onHide,
			playMenuOptions,
			searchText,
		});
	}

	let count = 0;
	for (const group of resultsGrouped) {
		count += group.results.length;
	}

	return {
		resultsGrouped,
		count,

		// Return this so we know "this set of results is from this searchText", to optimize rendering
		searchText,
	};
};

const ResultText = ({
	categoryPrefix,
	prefix,
	searchText,
	text,
}: {
	categoryPrefix: string | undefined;
	prefix: ReactNode | undefined;
	searchText: string;
	text: string | string[];
}) => {
	const textArray = Array.isArray(text) ? [...text] : [text];

	if (categoryPrefix) {
		textArray[0] = `${categoryPrefix} > ${textArray[0]}`;
	}

	let highlightedTextArray: ReactNode[];
	if (searchText === "") {
		highlightedTextArray = textArray;
	} else {
		let searchTextIndex = 0;
		highlightedTextArray = textArray.map((line) => {
			if (searchTextIndex === searchText.length) {
				return line;
			}

			const parts: {
				bold: boolean;
				text: string;
			}[] = [];

			// Skip spaces
			let target = searchText[searchTextIndex];
			let currentBold = false;
			let currentText = "";
			for (const char of line) {
				const charNormalized = normalizeIntl(char);
				if (charNormalized === target) {
					if (!currentBold) {
						// First bold character after non-bold
						if (currentText !== "") {
							parts.push({
								bold: currentBold,
								text: currentText,
							});
							currentText = "";
						}
						currentBold = true;
					}

					searchTextIndex += 1;
					target = searchText[searchTextIndex];
				} else if (currentBold) {
					// First non-bold character after bold
					if (currentText !== "") {
						parts.push({
							bold: currentBold,
							text: currentText,
						});
						currentText = "";
					}
					currentBold = false;
				}

				currentText += char;
			}

			// Handle last segment
			parts.push({
				bold: currentBold,
				text: currentText,
			});

			return (
				<>
					{parts.map((part, i) => {
						if (part.bold) {
							return (
								<span className="highlight-leader" key={i}>
									{part.text}
								</span>
							);
						}

						return <Fragment key={i}>{part.text}</Fragment>;
					})}
				</>
			);
		});
	}

	return (
		<div className="text-truncate" style={{ minWidth: 0 }}>
			{prefix}
			{highlightedTextArray.map((line, i) => {
				return (
					<Fragment key={i}>
						{i > 0 ? <br /> : null}
						{line}
					</Fragment>
				);
			})}
		</div>
	);
};

const ACTIVE_CLASS = "table-bg-striped";

// memo is so it doesn't render twice when searching (once as searchTextInput state updates before resultsGrouped/searchText updates)
const SearchResults = memo(
	({
		activeIndex,
		resultsGrouped,
		searchText,
	}: {
		activeIndex: number | undefined;
		resultsGrouped: Awaited<
			ReturnType<typeof getResultsGrouped>
		>["resultsGrouped"];
		searchText: string;
	}) => {
		const wrapperRef = useRef<HTMLDivElement | null>(null);

		const collapseGroups = searchText !== "";

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

		// This is needed in addition to the memo above because the activeIndex prop changes sometimes (such as when typing the first character, or when using up/down arrows), but we don't need to re-highlight the results just because activeIndex changed
		const highlightedResults = useMemo(() => {
			const normalizedSearchText = normalizeIntl(
				searchText.replaceAll(" ", ""),
			);

			const output = [];

			// KEEP INDEX LOGIC IN SYNC WITH CODE BELOW!
			for (const { results } of resultsGrouped) {
				for (const result of results) {
					const categoryPrefix =
						collapseGroups &&
						result.category &&
						!(result as any).hideCollapsedCategory
							? result.category
							: undefined;

					output.push(
						<ResultText
							categoryPrefix={categoryPrefix}
							prefix={result.prefix}
							searchText={normalizedSearchText}
							text={result.text}
						/>,
					);
				}
			}

			return output;
		}, [collapseGroups, resultsGrouped, searchText]);

		// KEEP INDEX LOGIC IN SYNC WITH CODE ABOVE!
		let index = 0;
		return (
			<div ref={wrapperRef}>
				{resultsGrouped.map(({ category, results }, i) => {
					const block = (
						<div
							key={category ?? i}
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
									const highlightedResult = highlightedResults[index];
									index += 1;

									return (
										<a
											key={j}
											{...result.anchorProps}
											className={`d-flex cursor-pointer list-group-item list-group-item-action border-0 text-nowrap ${
												active ? ACTIVE_CLASS : ""
											}`}
										>
											{highlightedResult}

											{active ? (
												<div className="ms-auto ps-1">
													Press enter to select
												</div>
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
	},
);

const ModeText = ({ inLeague }: { inLeague: boolean }) => {
	// Hide players/teams in league
	const modes = MODES.filter((mode) => inLeague || mode.key === "!");

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

const ComandPalette = ({
	show,
	onHide,
}: {
	show: boolean;
	onHide: () => void;
}) => {
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	const {
		challengeNoRatings,
		godMode,
		hideDisabledTeams,
		lid,
		playMenuOptions,
		teamInfoCache,
	} = useLocalPartial([
		"challengeNoRatings",
		"godMode",
		"hideDisabledTeams",
		"lid",
		"playMenuOptions",
		"teamInfoCache",
	]);
	const inLeague = lid !== undefined;

	const [searchTextInput, setSearchTextInput] = useState("");
	const [mode, setMode] = useState<undefined | Mode>();
	const [activeIndex, setActiveIndex] = useState<number | undefined>();
	const [{ resultsGrouped, count, searchText }, setResults] = useState<
		Awaited<ReturnType<typeof getResultsGrouped>>
	>({
		count: 0,
		resultsGrouped: [],
		searchText: "",
	});

	useEffect(() => {
		let active = true;

		const update = async () => {
			const newResults = await getResultsGrouped({
				challengeNoRatings,
				godMode,
				hideDisabledTeams,
				inLeague,
				mode,
				onHide,
				playMenuOptions,
				searchText: searchTextInput,
				teamInfoCache,
			});

			if (active) {
				setResults(newResults);
			}
		};

		update();

		return () => {
			active = false;
		};
	}, [
		challengeNoRatings,
		godMode,
		hideDisabledTeams,
		inLeague,
		mode,
		onHide,
		playMenuOptions,
		searchTextInput,
		teamInfoCache,
	]);

	useEffect(() => {
		if (show) {
			if (searchInputRef.current) {
				searchInputRef.current.focus();
			}

			saveLastUsed();
		} else {
			setSearchTextInput("");
			setMode(undefined);
			setActiveIndex(undefined);
		}
	}, [show]);

	useEffect(() => {
		if (!show) {
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
				setActiveIndex((index) => {
					if (index === undefined) {
						return 0;
					}

					if (index + 1 >= count) {
						return 0;
					}

					return index + 1;
				});
			} else if (event.code === "ArrowUp") {
				setActiveIndex((index) => {
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
		<Modal show={show} onHide={onHide} scrollable>
			<Modal.Header className="ps-3 pe-0 py-1">
				<span
					className="glyphicon glyphicon-search"
					style={{
						paddingBottom: 2,
					}}
				></span>
				<form
					className="flex-grow-1"
					onSubmit={(event) => {
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
							value={searchTextInput}
							onChange={(event) => {
								const newText = event.target.value;

								if (!mode && newText.length > 0) {
									const newMode = MODES.find((mode) => mode.key === newText[0]);
									if (newMode) {
										setMode(newMode);
										setSearchTextInput(newText.slice(1));
										setActiveIndex(newText.length > 1 ? 0 : undefined);
										return;
									}
								}

								setSearchTextInput(newText);
								setActiveIndex(newText.length > 0 ? 0 : undefined);
							}}
							onKeyDown={(event) => {
								// Handle backspace when mode is set and there is no text - unset mode
								if (
									searchTextInput === "" &&
									mode &&
									event.code === "Backspace"
								) {
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
					<p className="text-body-secondary px-3 pb-2 mb-2 border-bottom">
						<ModeText inLeague={inLeague} />
					</p>
				) : null}

				{resultsGrouped.length > 0 ? (
					<SearchResults
						activeIndex={activeIndex}
						resultsGrouped={resultsGrouped}
						searchText={searchText}
					/>
				) : (
					<div className="px-3">No results found.</div>
				)}
			</Modal.Body>
		</Modal>
	);
};

// Wrapper so useEffect stuff in CommandPalette does not run until it shows
const ComandPaletteWrapper = () => {
	const { show, onHide } = useCommandPalette();

	useEffect(() => {
		if (window.mobile) {
			return;
		}

		const lastUsedOrBugged = safeLocalStorage.getItem("commandPaletteLastUsed");
		if (lastUsedOrBugged === null) {
			saveLastUsed(true);
			return;
		}

		const lastDate = Number.parseInt(lastUsedOrBugged);
		if (Number.isNaN(lastDate)) {
			saveLastUsed();
			return;
		}

		const diff = Date.now() - lastDate;
		if (diff >= TWO_MONTHS_IN_MILLISECONDS) {
			logEvent({
				extraClass: "",
				type: "info",
				text: "Pro tip: press ctrl+k or cmd+k to open the command palette, which allows easy keyboard navigation of your league.",
				saveToDb: false,
				persistent: true,
			});
			saveLastUsed();
		}
	}, []);

	if (show) {
		return <ComandPalette show={show} onHide={onHide} />;
	}

	return null;
};

export default ComandPaletteWrapper;
