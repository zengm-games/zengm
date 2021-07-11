import classNames from "classnames";
import type { ButtonHTMLAttributes, MouseEvent } from "react";

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
	variant?: "primary" | "secondary";
}) => {
	return (
		<button
			type={type}
			className={classNames(
				`btn btn-${variant}`,
				size ? `btn-${size}` : undefined,
				className,
			)}
			disabled={disabled || processing}
			onClick={onClick}
		>
			{processing ? (
				<>
					<span
						className="spinner-border spinner-border-sm"
						role="status"
						aria-hidden="true"
					></span>{" "}
					Processing
				</>
			) : (
				children
			)}
		</button>
	);
};

export default ActionButton;
