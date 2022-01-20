import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import type {
	MenuItemHeader,
	MenuItemLink,
	MenuItemText,
} from "../../../common/types";
import { menuItems, useLocal } from "../../util";
import { getText, makeAnchorProps } from "../SideBar";

const useShowCommandPalette = () => {
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

	const onHide = useCallback(() => {
		setShow(false);
	}, []);

	return { show, onHide };
};

const MenuItemsBlock = ({
	className,
	header,
	menuItems,
	onHide,
}: {
	className?: string;
	header?: string;
	menuItems: MenuItemHeader["children"];
	onHide: () => void;
}) => {
	const lid = useLocal(state => state.lid);

	const filteredMenuItems = menuItems.filter(menuItem => {
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
	}) as MenuItemLink[];

	if (filteredMenuItems.length === 0) {
		return null;
	}

	return (
		<div className={`card border-0${className ? " " + className : ""}`}>
			{header ? (
				<div className="card-header bg-transparent border-0">
					<span className="fw-bold text-secondary text-uppercase">
						{header}
					</span>
				</div>
			) : null}
			<div className="list-group list-group-flush">
				{filteredMenuItems.map(menuItem => {
					const anchorProps = makeAnchorProps(menuItem, onHide, true);

					return (
						<a
							{...anchorProps}
							className="cursor-pointer list-group-item list-group-item-action border-0"
						>
							{getText(menuItem.text)}
						</a>
					);
				})}
			</div>
		</div>
	);
};

const MenuItems = ({
	onHide,
	searchText,
}: {
	onHide: () => void;
	searchText: string;
}) => {
	const flat = menuItems.filter(
		menuItem => menuItem.type === "link",
	) as MenuItemLink[];
	const nested = menuItems.filter(
		menuItem => menuItem.type === "header",
	) as MenuItemHeader[];

	return (
		<>
			<MenuItemsBlock menuItems={flat} onHide={onHide} />
			{nested.map(header => (
				<MenuItemsBlock
					className="pt-2 mt-2 border-top"
					header={header.long}
					menuItems={header.children}
					onHide={onHide}
				/>
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

			<Modal.Body className="py-2 px-0">
				{searchText === "" && !mode ? (
					<p className="text-muted px-3 pb-2 mb-2 border-bottom">
						Type @ to search players and teams
					</p>
				) : null}

				<MenuItems onHide={onHide} searchText={searchText} />
			</Modal.Body>
		</Modal>
	);
};

export default ComandPalette;
