import { useState, type CSSProperties } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { Sketch } from "./Sketch";

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

	return (
		<OverlayTrigger
			trigger="click"
			placement="auto"
			overlay={
				<Popover>
					<Sketch
						color={hex}
						onChange={color => {
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
