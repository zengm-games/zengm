import { useEffect, useState } from "react";

type Props = {
	onCheck?: (chkd: boolean) => void;
	text: string;
	checked?: boolean;
	className?: string;
	tooltip?: string;
};

export const ToggleItem = ({
	onCheck,
	text,
	checked,
	className,
	tooltip,
}: Props) => {
	const [isChecked, setChecked] = useState(false);

	const toggleCheck = () => {
		const newState = !isChecked;
		setChecked(newState);
		if (onCheck) onCheck(newState);
	};

	useEffect(() => {
		if (checked !== undefined) setChecked(checked);
	}, [checked]);

	const classChecked = "toggle-item-checked text-center " + (className || "");
	const classDefault = "toggle-item-default text-center " + (className || "");
	return (
		<div
			onClick={toggleCheck}
			title={
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				tooltip || undefined
			}
			className={isChecked ? classChecked : classDefault}
		>
			{" "}
			{text}{" "}
		</div>
	);
};
