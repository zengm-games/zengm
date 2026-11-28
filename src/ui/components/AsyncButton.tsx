import type { ReactNode } from "react";
import { useAction } from "../util/useAction.ts";

// Use ActionButton for longer running things
export const AsyncButton = ({
	children,
	className,
	disabled,
	onClick,
}: {
	children: ReactNode;
	className?: string;
	disabled?: boolean;
	onClick: () => Promise<unknown>;
}) => {
	const { busy, run } = useAction();

	return (
		<button
			className={className}
			disabled={disabled || busy}
			onClick={() => run(onClick)}
		>
			{children}
		</button>
	);
};
