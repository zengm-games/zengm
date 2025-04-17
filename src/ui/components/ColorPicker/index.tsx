import { useState, type CSSProperties } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { Sketch } from "./Sketch.tsx";

export const ColorPicker = ({
	onClick,
	onChange,
	style,
	value,
}: {
	onClick?: () => void;
	onChange: (hex: string) => void;
	style?: CSSProperties;
	value: string;
}) => {
	const [hex, setHex] = useState(value);

	// Using this (plus a wrapper div in Modal.tsx) fixed the bug mentioned below about the inputs, but it broke scrolling behavior of the modal body in Firefox, so switching to enforceFocus={false} manually applied to modals that conatin the color picker (only one currently)
	/*// modalRef stuff is needed until https://github.com/react-bootstrap/react-overlays/issues/1003 is fixed, otherwise can't type in inputs in color picker
	const ref = useRef<HTMLButtonElement>(null);
	const modalRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (ref.current) {
			// Search for a div inside the modal, rather than the .modal itself, like suggested https://github.com/react-bootstrap/react-bootstrap/issues/5846#issuecomment-2017368604 - otherwise there is weird behavior with the color picker (drag starting inside color picker but ending outside the color picker and inside the modal would result in closing the modal)
			modalRef.current = ref.current.closest(".modal-child-overlay-container");
			// modalRef.current = document.getElementsByClassName("modal-child-overlay-container")[0] ?? null;
		}
	}, []);*/

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover>
					<Sketch
						color={hex}
						onChange={(color) => {
							setHex(color.hex);
							onChange(color.hex);
						}}
					/>
				</Popover>
			}
			rootClose
		>
			<button
				className="btn btn-link"
				onClick={onClick}
				style={{
					...style,
					backgroundColor: hex,
				}}
				type="button"
			/>
		</OverlayTrigger>
	);
};
