import { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";

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
		<Modal animation={false} show={show} onHide={onHide}>
			<Modal.Header className="p-1">
				<span
					className="glyphicon glyphicon-search ms-1"
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

			<Modal.Body className="p-2">
				{searchText === "" && !mode ? (
					<p className="text-muted">Type @ to search players and teams</p>
				) : null}

				<p>Modal body text goes here.</p>
			</Modal.Body>
		</Modal>
	);
};

export default ComandPalette;
