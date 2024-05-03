import { useState, type CSSProperties } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import Sketch from "@uiw/react-color-sketch";

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

	// https://alumni.media.mit.edu/~wad/color/palette.html since the defaults in @uiw/react-color-sketch are only 15 colors, leaving a blank spot
	const PRESET_COLORS = [
		"#AD2323",
		"#FF9233",
		"#FFEE33",
		"#E9DEBB",
		"#814A19",
		"#2A4BD7",
		"#9DAFFF",
		"#29D0D0",
		"#1D6914",
		"#81C57A",
		"#8126C0",
		"#FFCDF3",
		"#000000",
		"#575757",
		"#A0A0A0",
		"#FFFFFF",
	];

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
						disableAlpha
						presetColors={PRESET_COLORS}
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
