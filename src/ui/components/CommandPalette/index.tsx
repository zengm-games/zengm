import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../../common/types";
import { helpers, menuItems, useLocal } from "../../util";
import { getText, makeAnchorProps } from "../SideBar";

const useShowCommandPalette = () => {
	const [show, setShow] = useState(true);

	useEffect(() => {
		if (window.mobile) {
			return;
		}

		const handleKeydown = (event: KeyboardEvent) => {
			if (
				event.altKey ||
				event.shiftKey ||
				event.isComposing ||
				event.code !== "KeyK"
			) {
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

	const onHide = useCallback(() => {
		setShow(false);
	}, []);

	return { show, onHide };
};

const MenuItems = ({
	onHide,
	searchText,
}: {
	onHide: () => void;
	searchText: string;
}) => {
	const lid = useLocal(state => state.lid);

	const filter = (menuItem: MenuItemLink | MenuItemText) => {
		if (menuItem.type === "text") {
			return false;
		}

		if (!menuItem.league && lid !== undefined) {
			return false;
		}

		if (!menuItem.nonLeague && lid === undefined) {
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

	return (
		<>
			<div className="card border-0">
				<div className="list-group list-group-flush">
					{flat.filter(filter).map(menuItem => {
						const anchorProps = makeAnchorProps(menuItem, onHide);

						if (anchorProps.href !== undefined) {
							anchorProps.onClick = onHide;
						}

						return (
							<a
								{...anchorProps}
								className="cursor-pointer list-group-item list-group-item-action px-0"
							>
								{getText(menuItem.text)}
							</a>
						);
					})}
				</div>
			</div>
			{nested.map(header => (
				<div className="card border-0 mt-2">
					<div className="card-header bg-transparent px-0">
						<span className="fw-bold text-secondary text-uppercase">
							{header.long}
						</span>
					</div>
					<div className="list-group list-group-flush">
						{(header.children.filter(filter) as MenuItemLink[]).map(
							menuItem => {
								const anchorProps = makeAnchorProps(menuItem, onHide);

								if (anchorProps.href !== undefined) {
									anchorProps.onClick = onHide;
								}

								return (
									<a
										{...anchorProps}
										className="cursor-pointer list-group-item list-group-item-action px-0"
									>
										{getText(menuItem.text)}
									</a>
								);
							},
						)}
					</div>
				</div>
			))}
		</>
	);
};

const ComandPalette = () => {
	const { show, onHide } = useShowCommandPalette();
	const [searchText, setSearchText] = useState("");
	const [mode, setMode] = useState<undefined | "@">();
	const searchInputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		if (show && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [show]);

	console.log("show", show);
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
						<span className="input-group-text px-1 border-0 rounded-3">@</span>
					) : null}
					<input
						ref={searchInputRef}
						className="form-control shadow-none border-0 ps-1 pe-0"
						type="text"
						placeholder="Search..."
						style={{
							fontSize: 15,
						}}
						value={searchText}
						onChange={event => {
							const newText = event.target.value;
							if (newText.startsWith("@")) {
								setMode("@");
								setSearchText(newText.slice(1));
							} else {
								setSearchText(newText);
							}
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

			<Modal.Body className="py-2 px-3">
				{searchText === "" && !mode ? (
					<p className="text-muted">Type @ to search players and teams</p>
				) : null}

				<MenuItems onHide={onHide} searchText={searchText} />
			</Modal.Body>
		</Modal>
	);
};

export default ComandPalette;
