import type { CSSProperties, SyntheticEvent } from "react";

const NextPrevButtons = <T extends unknown>({
	currentItem,
	items,
	reverse,
	disabled,
	onChange,
	style,
}: {
	currentItem?: T;
	items: T[];
	reverse?: boolean;
	disabled?: boolean;
	onChange: (newItem: T) => void;
	style?: CSSProperties;
}) => {
	const index = items.indexOf(currentItem as any);

	const buttonInfo = [
		{
			disabled: disabled || index <= 0,
			onClick: (event: SyntheticEvent) => {
				event.preventDefault();
				const newItem = items[index - 1];
				if (newItem !== undefined) {
					onChange(newItem);
				}
			},
		},
		{
			disabled: disabled || index >= items.length - 1,
			onClick: (event: SyntheticEvent) => {
				event.preventDefault();
				const newItem = items[index + 1];
				if (newItem !== undefined) {
					onChange(newItem);
				}
			},
		},
	];

	// Seasons are displayed in reverse order in the dropdown, and "prev" should be "back in time"
	if (reverse) {
		buttonInfo.reverse();
	}

	return (
		<div className="btn-group" style={style}>
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={buttonInfo[0].disabled}
				onClick={buttonInfo[0].onClick}
				title="Previous"
			>
				<span className="glyphicon glyphicon-menu-left" />
			</button>
			<button
				className="btn btn-light-bordered btn-xs"
				disabled={buttonInfo[1].disabled}
				onClick={buttonInfo[1].onClick}
				title="Next"
			>
				<span className="glyphicon glyphicon-menu-right" />
			</button>
		</div>
	);
};

export default NextPrevButtons;
