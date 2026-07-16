import { useState, type ReactNode } from "react";
import { toWorker } from "../util/toWorker.ts";
import { helpers } from "../util/helpers.ts";
import { showNotification } from "../util/showNotification.ts";

type Props = {
	actionName?: string;
	undoKey: number;
	title: ReactNode;
};

const UndoNotification = ({ actionName = "action", undoKey, title }: Props) => {
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
								result = await toWorker("main", "undoAction", undoKey);
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

export const showUndoNotification = (props: Props) => {
	showNotification({
		type: "info",
		text: <UndoNotification {...props} />,
	});
};
