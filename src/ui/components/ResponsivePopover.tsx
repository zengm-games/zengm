import { ReactNode, useState } from "react";
import { Modal, Popover } from "react-bootstrap";
import OverlayTriggerPopoverAuto from "./OverlayTriggerPopoverAuto";

const ResponsivePopover = ({
	id,
	modalHeader,
	modalBody,
	popoverContent,
	renderTarget,
	toggle,
}: {
	id: string;
	modalHeader: ReactNode;
	modalBody: ReactNode;
	popoverContent: ReactNode;
	renderTarget: (props: { onClick?: () => void }) => ReactNode;
	toggle?: () => void;
}) => {
	const [showModal, setShowModal] = useState(false);

	if (window.mobile) {
		return (
			<>
				{renderTarget({
					onClick: () => {
						setShowModal(true);
						if (toggle) {
							toggle();
						}
					},
				})}
				<Modal
					animation={false}
					centered
					show={showModal}
					onHide={() => {
						setShowModal(false);
					}}
				>
					<Modal.Header closeButton>{modalHeader}</Modal.Header>
					<Modal.Body>{modalBody}</Modal.Body>
				</Modal>
			</>
		);
	}

	return (
		<OverlayTriggerPopoverAuto
			popoverContent={<Popover.Content>{popoverContent}</Popover.Content>}
			popoverID={id}
			onEnter={toggle}
		>
			{renderTarget({}) as any}
		</OverlayTriggerPopoverAuto>
	);
};

export default ResponsivePopover;
