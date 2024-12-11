import clsx from "clsx";
import {
	type ButtonHTMLAttributes,
	type MouseEvent,
	type ReactNode,
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

const styleGrid11 = {
	gridColumn: 1,
	gridRow: 1,
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
	// maintainWidth d-inline-grid stuff is from https://x.com/wesbos/status/1834242925401694490
	return (
		<button
			type={type}
			className={clsx(
				`btn btn-${variant}`,
				size ? `btn-${size}` : undefined,
				maintainWidth ? "d-inline-grid" : undefined,
				className,
			)}
			disabled={disabled || processing}
			onClick={onClick}
		>
			{maintainWidth ? (
				<>
					<span
						style={styleGrid11}
						className={processing ? "opacity-0" : "opacity-100"}
					>
						{children}
					</span>
					<span
						style={styleGrid11}
						className={processing ? "opacity-100" : "opacity-0"}
					>
						<ProcessingSpinner text={processingText} />
					</span>
				</>
			) : processing ? (
				<ProcessingSpinner text={processingText} />
			) : (
				children
			)}
		</button>
	);
};

export default ActionButton;
