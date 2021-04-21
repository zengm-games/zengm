import classNames from "classnames";
import PropTypes from "prop-types";
import type { MouseEvent } from "react";
import useClickable from "../../hooks/useClickable";
// eslint-disable-next-line import/no-unresolved
import type { Argument } from "classnames";

const Row = ({
	row,
}: {
	row: {
		classNames?: Argument;
		data: any[];
	};
}) => {
	const { clicked, toggleClicked } = useClickable();
	return (
		<tr
			className={classNames(row.classNames, {
				"table-warning": clicked,
			})}
			onClick={toggleClicked}
		>
			{row.data.map((value = null, i) => {
				// Value is either the value, or an object containing the value as a property
				const actualValue =
					value !== null && value.hasOwnProperty("value") ? value.value : value;

				const props: any = {};

				if (value && value.classNames) {
					props.className = classNames(value.classNames);
				}

				if (value && value.title) {
					props.title = value.title;
				}

				if (value && value.style) {
					props.style = value.style;
				}

				const singleCheckbox =
					actualValue &&
					actualValue.type === "input" &&
					actualValue.props.type === "checkbox" &&
					actualValue.props.onChange;
				const singleButton =
					actualValue &&
					actualValue.type === "button" &&
					actualValue.props.onClick;

				// Expand clickable area of checkboxes/buttons to the whole td
				if (singleCheckbox || singleButton) {
					props.onClick = (event: MouseEvent) => {
						if (
							event.target &&
							(event.target as any).tagName === "TD" &&
							!actualValue.props.disabled
						) {
							if (singleCheckbox) {
								actualValue.props.onChange();
							} else {
								actualValue.props.onClick();
							}
						}
					};
					props["data-no-row-highlight"] = "true";
				}

				// eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
				return (
					<td key={i} {...props}>
						{actualValue}
					</td>
				);
			})}
		</tr>
	);
};

Row.propTypes = {
	row: PropTypes.shape({
		data: PropTypes.array.isRequired,
	}).isRequired,
};

export default Row;
