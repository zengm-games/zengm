import { useEffect, useId, useState, type ReactNode } from "react";
import { copyToClipboard } from "../util/copyToClipboard.ts";

const COPIED_DURATION = 2000;

// Read-only text field with a copy button, for things like URLs that people want to paste somewhere else rather than click
export const CopyableText = ({
	className,
	description,
	label,
	value,
}: {
	className?: string;
	description?: ReactNode;
	label: string;
	value: string;
}) => {
	const id = useId();
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) {
			return;
		}
		const timeoutID = setTimeout(() => {
			setCopied(false);
		}, COPIED_DURATION);
		return () => {
			clearTimeout(timeoutID);
		};
	}, [copied]);

	return (
		<div className={className}>
			<label className="form-label" htmlFor={id}>
				{label}
			</label>
			<div className="input-group">
				<input
					id={id}
					type="text"
					className="form-control"
					value={value}
					readOnly
					onFocus={(event) => {
						event.currentTarget.select();
					}}
				/>
				<button
					className="btn btn-secondary"
					type="button"
					onClick={async () => {
						const success = await copyToClipboard(value);
						if (success) {
							setCopied(true);
						}
					}}
				>
					{copied ? "Copied!" : "Copy"}
				</button>
			</div>
			{description ? <div className="form-text">{description}</div> : null}
		</div>
	);
};
