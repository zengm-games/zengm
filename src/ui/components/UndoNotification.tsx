import { useState, type ReactNode } from "react";
import { toWorker } from "../util/toWorker.ts";
import { helpers } from "../util/helpers.ts";

export const UndoNotification = ({
	actionName = "action",
	rollbackKey,
	title,
}: {
	actionName?: string;
	rollbackKey: number;
	title: ReactNode;
}) => {
	const [status, setStatus] = useState<"init" | "waiting" | "success" | "fail">(
		"init",
	);

	if (status === "success") {
		return `${helpers.upperCaseFirstLetter(actionName)} undone`;
	} else if (status === "fail") {
		return `Failed to undo ${actionName}`;
	} else {
		return (
			<>
				<div>{title}</div>
				<div className="mt-2">
					<button
						className="btn btn-sm btn-secondary"
						disabled={status === "waiting"}
						onClick={async () => {
							setStatus("waiting");
							let result;
							try {
								result = await toWorker("main", "undoAction", rollbackKey);
							} finally {
								if (result) {
									setStatus("success");
								} else {
									setStatus("fail");
								}
							}
						}}
					>
						Undo
					</button>
				</div>
			</>
		);
	}
};
