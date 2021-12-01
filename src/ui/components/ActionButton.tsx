import classNames from "classnames";
import { ButtonHTMLAttributes, MouseEvent, useRef } from "react";

export const processingSpinner = (
	<>
		<span
			className="spinner-border spinner-border-sm"
			role="status"
			aria-hidden="true"
		></span>{" "}
		Processing
	</>
);

const ActionButton = ({
	children,
	className,
	disabled,
	onClick,
	processing,
	size,
	type,
	variant = "primary",
}: {
	children: string;
	className?: string;
	disabled?: boolean;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	processing: boolean;
	size?: "lg";
	type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
	variant?: "primary" | "secondary" | "god-mode" | "danger";
}) => {
	const minWidth = useRef(0);
	const button = useRef<HTMLButtonElement>(null);

	return (
		<button
			ref={button}
			type={type}
			className={classNames(
				`btn btn-${variant}`,
				size ? `btn-${size}` : undefined,
				className,
			)}
			disabled={disabled || processing}
			onClick={event => {
				// When we switch to "Processing", don't let the button shrink in width. (Ideally we'd also prevent it from growing, but oh well)
				if (button.current) {
					minWidth.current = button.current.offsetWidth;
				}

				if (onClick) {
					onClick(event);
				}
			}}
			style={{
				minWidth: minWidth.current,
			}}
		>
			{processing ? processingSpinner : children}
		</button>
	);
};

export default ActionButton;
