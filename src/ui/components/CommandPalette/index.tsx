import { matchSorter } from "match-sorter";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import { groupBy } from "../../../common/groupBy";
import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../../common/types";
import { menuItems, useLocal } from "../../util";
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

	const onHide = useCallback(() => {
		setShow(false);
		setSearchText("");
		setMode(undefined);
	}, []);

	return { show, onHide, searchText, setSearchText, mode, setMode };
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
	inLeague,
	onHide,
	mode,
	searchText,
}: {
	inLeague: boolean;
	onHide: () => void;
	mode: Mode | undefined;
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
	const resultsGrouped = groupBy(results, "category");

	const filteredResults = matchSorter(results, searchText, {
		keys: ["search"],
	});
	const filteredResultsGrouped = groupBy(filteredResults, "category");
	console.log(results);

	const output = [];
	for (const category of Object.keys(resultsGrouped)) {
		console.log("hi", category);
		if (filteredResultsGrouped[category]) {
			output.push({
				category,
				results: filteredResultsGrouped[category],

				// Put category header inline if not all of the category is shown
				collapse:
					resultsGrouped[category].length !==
					filteredResultsGrouped[category].length,
			});
		}
	}

	return output;
};

const SearchResults = ({
	inLeague,
	onHide,
	mode,
	searchText,
}: {
	inLeague: boolean;
	onHide: () => void;
	mode: Mode | undefined;
	searchText: string;
}) => {
	const resultsGrouped = getResultsGrouped({
		inLeague,
		onHide,
		mode,
		searchText,
	});

	if (resultsGrouped.length === 0) {
		return <div className="px-3">No results found.</div>;
	}

	return (
		<>
			{resultsGrouped.map(({ category, results, collapse }, i) => {
				const block = (
					<div
						key={category}
						className={`card border-0${i > 0 ? " pt-2 mt-2 border-top" : ""}`}
					>
						{!collapse && category ? (
							<div className="card-header bg-transparent border-0">
								<span className="fw-bold text-secondary text-uppercase">
									{category}
								</span>
							</div>
						) : null}
						<div className="list-group list-group-flush rounded-0">
							{results.map((result, j) => {
								const active = i === 0 && j === 0 && searchText !== "";

								return (
									<a
										key={j}
										{...result.anchorProps}
										className={`d-flex cursor-pointer list-group-item list-group-item-action border-0 ${
											active ? "table-bg-striped" : ""
										}`}
									>
										{collapse && category ? <>{category} &gt; </> : null}
										{result.text}

										{active ? (
											<div className="ms-auto">Press enter to go</div>
										) : null}
									</a>
								);
							})}
						</div>
					</div>
				);

				return block;
			})}
		</>
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
	const { show, onHide, searchText, setSearchText, mode, setMode } =
		useCommandPalette();
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	const lid = useLocal(state => state.lid);
	const inLeague = lid !== undefined;

	useEffect(() => {
		if (show && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [show]);

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
									return;
								}
							}

							setSearchText(newText);
						}}
						onKeyDown={event => {
							// Handle backspace when mode is set and there is no text - unset mode
							if (searchText === "" && mode && event.code === "Backspace") {
								setMode(undefined);
							}
						}}
					/>
				</div>
			</Modal.Header>

			<Modal.Body className="py-2 px-0">
				{searchText === "" && !mode ? (
					<p className="text-muted px-3 pb-2 mb-2 border-bottom">
						<ModeText inLeague={inLeague} />
					</p>
				) : null}

				<SearchResults
					inLeague={inLeague}
					onHide={onHide}
					mode={mode}
					searchText={searchText}
				/>
			</Modal.Body>
		</Modal>
	);
};

export default ComandPalette;
