import { useState, type ReactNode } from "react";
import { toWorker } from "../util/toWorker.ts";
import { helpers } from "../util/helpers.ts";
import { showNotification } from "../util/showNotification.ts";

type Props = {
	actionName?: string;
	undoKey: number;
	title: ReactNode;
};

const NEGATIVE_MARGIN = 4;

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
			<div
				className="d-flex"
				style={{
					margin: `-${NEGATIVE_MARGIN}px 0`,
				}}
			>
				<div
					style={{
						padding: `${NEGATIVE_MARGIN}px 0`,
					}}
				>
					{title}
				</div>
				<div className="ms-auto">
					<button
						className="btn btn-sm btn-secondary"
						disabled={status === "waiting"}
						onClick={async () => {
							setStatus("waiting");
							let result;
							try {
								result = await toWorker("undoLog", "undo", undoKey);
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
			</div>
		);
	}
};

export const showUndoNotification = (props: Props) => {
	showNotification({
		type: "info",
		text: <UndoNotification {...props} />,
		onClose: async () => {
			await toWorker("undoLog", "remove", props.undoKey);
		},
	});
};
