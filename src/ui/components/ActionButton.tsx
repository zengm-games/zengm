import classNames from "classnames";
import {
	type ButtonHTMLAttributes,
	type MouseEvent,
	type ReactNode,
	useRef,
} from "react";

export const ProcessingSpinner = ({
	text = "Processing",
}: {
	text?: string;
}) => {
	return (
		<>
			<span
				className="spinner-border spinner-border-sm"
				role="status"
				aria-hidden="true"
			></span>{" "}
			{text}
		</>
	);
};

const ActionButton = ({
	children,
	className,
	disabled,
	maintainWidth = true,
	onClick,
	processing,
	processingText,
	size,
	type,
	variant = "primary",
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	maintainWidth?: boolean;
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
	processing: boolean;
	processingText?: string;
	size?: "lg";
	type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
	variant?: "primary" | "secondary" | "god-mode" | "danger" | "light-bordered";
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
			style={
				maintainWidth
					? {
							minWidth: minWidth.current,
					  }
					: undefined
			}
		>
			{processing ? <ProcessingSpinner text={processingText} /> : children}
		</button>
	);
};

export default ActionButton;
