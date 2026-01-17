import clsx from "clsx";
import { type SelectHTMLAttributes } from "react";

export const height = 35.5;

export const FancySelect = ({
	className,
	disabled,
	onChange,
	onMiddleClick,
	options,
	value,
}: {
	className?: string;
	disabled: boolean;
	onMiddleClick: (() => void) | undefined;
	options: {
		key: string | number;
		value: string;
	}[];
} & Pick<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value">) => {
	const selected = options.find((option) => option.key === value);

	return (
		<div
			className={clsx(
				"position-relative d-flex align-items-center justify-content-center",
				className,
			)}
			style={{ height }}
		>
			{selected?.value}

			{disabled ? undefined : (
				<select
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						opacity: 0,
						cursor: "pointer",
					}}
					onChange={onChange}
					onMouseDown={
						onMiddleClick
							? (event) => {
									if (event.button === 1) {
										event.preventDefault();
										onMiddleClick();
									}
								}
							: undefined
					}
					value={value}
				>
					{options.map((option) => {
						return (
							<option key={option.key} value={option.key}>
								{option.value}
							</option>
						);
					})}
				</select>
			)}
		</div>
	);
};
