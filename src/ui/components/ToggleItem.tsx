import { useEffect, useState } from "react";

type Props = {
	onCheck?: (chkd: boolean) => void;
	text: string;
	isChecked?: boolean;
	className?: string;
	tooltip?: string;
};

export const ToggleItem = ({
	onCheck,
	text,
	isChecked,
	className,
	tooltip,
}: Props) => {
	const [checked, setChecked] = useState(false);
	const defaultStyle = {
		padding: "3px 7px",
		borderRadius: "50px",
		fontSize: "12px",
		borderWidth: "1px",
		cursor: "pointer",
		width: "40px",
		display: "inline-block",
		margin: "0 5px 0 0",
	};
	const [style, setStyle] = useState(defaultStyle);

	const toggleCheck = () => {
		const newState = !checked;
		setChecked(newState);
		if (onCheck) onCheck(newState);
	};

	useEffect(() => {
		if (isChecked !== undefined) {
			setChecked(isChecked);
		} else setStyle(defaultStyle);
	}, [isChecked]);

	const classChecked = "check-item-checked text-center " + (className || "");
	const classDefault = "check-item-default text-center " + (className || "");
	return (
		<div
			onClick={toggleCheck}
			title={
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				tooltip || undefined
			}
			style={style}
			className={checked ? classChecked : classDefault}
		>
			{" "}
			{text}{" "}
		</div>
	);
};
