import React, { useState, type CSSProperties, type Ref } from "react";
import Saturation from "@uiw/react-color-saturation";
import EditableInput from "@uiw/react-color-editable-input";
import RGBA from "@uiw/react-color-editable-input-rgba";
import Hue from "@uiw/react-color-hue";
import {
	validHex,
	type HsvaColor,
	hsvaToHex,
	hexToHsva,
	color as handleColor,
	type ColorResult,
} from "@uiw/color-convert";
import Swatch, { type SwatchPresetColor } from "@uiw/react-color-swatch";
import { useEffect } from "react";

// Similar to https://github.com/uiwjs/react-color/blob/632d4e9201e26b42ee7d5bfeda407144e9a6e2f3/packages/color-sketch/src/index.tsx but with EyeDropper added

// https://gist.github.com/bkrmendy/f4582173f50fab209ddfef1377ab31e3
interface ColorSelectionOptions {
	signal?: AbortSignal;
}
interface ColorSelectionResult {
	sRGBHex: string;
}
interface EyeDropper {
	open: (options?: ColorSelectionOptions) => Promise<ColorSelectionResult>;
}
interface EyeDropperConstructor {
	new (): EyeDropper;
}
declare global {
	interface Window {
		EyeDropper?: EyeDropperConstructor | undefined;
	}
}

const EyeDropperButton = ({
	onChange,
}: {
	onChange: (hex: string) => void;
}) => {
	if (!window.EyeDropper) {
		return null;
	}

	// https://icons.getbootstrap.com/icons/eyedropper/ v1.11.3
	const eyedropperIcon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			fill="currentColor"
			viewBox="0 0 16 16"
		>
			<path d="M13.354.646a1.207 1.207 0 0 0-1.708 0L8.5 3.793l-.646-.647a.5.5 0 1 0-.708.708L8.293 5l-7.147 7.146A.5.5 0 0 0 1 12.5v1.793l-.854.853a.5.5 0 1 0 .708.707L1.707 15H3.5a.5.5 0 0 0 .354-.146L11 7.707l1.146 1.147a.5.5 0 0 0 .708-.708l-.647-.646 3.147-3.146a1.207 1.207 0 0 0 0-1.708zM2 12.707l7-7L10.293 7l-7 7H2z" />
		</svg>
	);

	return (
		<button
			className="btn pt-0 ps-2 pe-1"
			type="button"
			onClick={async () => {
				const eyeDropper = new window.EyeDropper!();
				try {
					const result = await eyeDropper.open();
					onChange(result.sRGBHex.slice(1));
				} catch {
					// The user escaped the eyedropper mode, do nothing
				}
			}}
		>
			{eyedropperIcon}
		</button>
	);
};

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

export interface SketchProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "color"> {
	prefixCls?: string;
	width?: number;
	color?: string | HsvaColor;
	presetColors?: false | SwatchPresetColor[];
	onChange?: (newShade: ColorResult) => void;
	ref?: Ref<HTMLDivElement>;
}

const Bar = (props: { left?: string }) => (
	<div
		style={{
			boxShadow: "rgb(0 0 0 / 60%) 0px 0px 2px",
			width: 4,
			top: 1,
			bottom: 1,
			left: props.left,
			borderRadius: 1,
			position: "absolute",
			backgroundColor: "#fff",
		}}
	/>
);

export const Sketch = (props: SketchProps) => {
	const {
		prefixCls = "w-color-sketch",
		className,
		onChange,
		width = 218,
		color,
		style,
		ref,
		...other
	} = props;
	const [hsva, setHsva] = useState({ h: 209, s: 36, v: 90, a: 1 });
	useEffect(() => {
		if (typeof color === "string" && validHex(color)) {
			setHsva(hexToHsva(color));
		}
		if (typeof color === "object") {
			setHsva(color);
		}
	}, [color]);

	const handleChange = (hsv: HsvaColor) => {
		setHsva(hsv);
		if (onChange) {
			onChange(handleColor(hsv));
		}
	};

	const handleHex = (value: string | number) => {
		if (
			typeof value === "string" &&
			validHex(value) &&
			/(3|6)/.test(String(value.length))
		) {
			handleChange(hexToHsva(value));
		}
	};
	const handleSaturationChange = (newColor: HsvaColor) =>
		handleChange({ ...hsva, ...newColor, a: hsva.a });
	const styleMain = {
		"--sketch-background": "rgb(255, 255, 255)",
		"--sketch-box-shadow":
			"rgb(0 0 0 / 15%) 0px 0px 0px 1px, rgb(0 0 0 / 15%) 0px 8px 16px",
		"--sketch-swatch-box-shadow": "rgb(0 0 0 / 15%) 0px 0px 0px 1px inset",
		"--sketch-swatch-border-top": "1px solid rgb(238, 238, 238)",
		background: "var(--sketch-background)",
		borderRadius: 4,
		boxShadow: "var(--sketch-box-shadow)",
		width,
		...style,
	} as CSSProperties;
	const styleSwatch = {
		borderTop: "var(--sketch-swatch-border-top)",
		paddingTop: 10,
		paddingLeft: 10,
	} as CSSProperties;
	const styleSwatchRect = {
		marginRight: 10,
		marginBottom: 10,
		borderRadius: 3,
		boxShadow: "var(--sketch-swatch-box-shadow)",
	} as CSSProperties;
	return (
		<div
			{...other}
			className={`${prefixCls} ${className || ""}`}
			ref={ref}
			style={styleMain}
		>
			<div style={{ padding: "10px 10px 8px" }}>
				<Saturation
					hsva={hsva}
					style={{ width: "auto", height: 150 }}
					onChange={handleSaturationChange}
				/>
				<div style={{ display: "flex", marginTop: 4 }}>
					<div style={{ flex: 1 }}>
						<Hue
							width="auto"
							height={10}
							hue={hsva.h}
							pointer={Bar}
							innerProps={{
								style: { marginLeft: 1, marginRight: 5 },
							}}
							onChange={(newHue) => handleChange({ ...hsva, ...newHue })}
						/>
					</div>
				</div>
			</div>
			<div style={{ display: "flex", margin: "0 10px 3px 10px" }}>
				<EditableInput
					label="Hex"
					value={hsvaToHex(hsva).replace(/^#/, "").toLocaleUpperCase()}
					onChange={(evn, val) => handleHex(val)}
					style={{ minWidth: 58 }}
				/>
				<RGBA
					hsva={hsva}
					style={{ marginLeft: 6 }}
					aProps={false}
					onChange={(result) => handleChange(result.hsva)}
				/>
				<EyeDropperButton onChange={handleHex} />
			</div>
			<Swatch
				style={styleSwatch}
				colors={PRESET_COLORS}
				color={hsvaToHex(hsva)}
				onChange={(hsvColor) => handleChange(hsvColor)}
				rectProps={{
					style: styleSwatchRect,
				}}
			/>
		</div>
	);
};
