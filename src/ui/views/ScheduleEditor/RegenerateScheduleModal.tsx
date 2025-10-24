import { useEffect, useRef, useState } from "react";
import { Modal } from "react-bootstrap";
import ActionButton from "../../components/ActionButton.tsx";
import logEvent from "../../util/logEvent.ts";
import type { View } from "../../../common/types.ts";
import { toWorker } from "../../util/index.ts";

export const RegenerateScheduleModal = ({
	onCancel,
	onRegenerated,
	show,
}: {
	onCancel: () => void;
	onRegenerated: (schedule: View<"scheduleEditor">["schedule"]) => void;
	show: boolean;
}) => {
	const [regeneratingSchedule, setRegeneratingSchedule] = useState(false);

	const submitButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (submitButtonRef.current) {
			submitButtonRef.current.focus();
		}
	}, []);

	const onSubmit = async () => {
		setRegeneratingSchedule(true);

		try {
			const schedule = await toWorker("main", "regenerateSchedule", undefined);
			onRegenerated(schedule);
		} catch (error) {
			logEvent({
				type: "error",
				text: error.message,
				saveToDb: false,
			});
		} finally {
			setRegeneratingSchedule(false);
		}
	};

	return (
		<Modal show={show} onHide={onCancel}>
			<Modal.Body>Are you sure you want to regenerate the schedule?</Modal.Body>
			<Modal.Footer>
				<button
					className="btn btn-secondary"
					disabled={regeneratingSchedule}
					onClick={onCancel}
				>
					Cancel
				</button>
				<ActionButton
					onClick={onSubmit}
					processing={regeneratingSchedule}
					processingText="Generating"
					ref={submitButtonRef}
					variant="primary"
				>
					Regenerate schedule
				</ActionButton>
			</Modal.Footer>
		</Modal>
	);
};
