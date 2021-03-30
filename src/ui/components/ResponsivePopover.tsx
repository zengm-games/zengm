import { ReactNode, useEffect, useState } from "react";
import { Modal, Popover } from "react-bootstrap";
import OverlayTriggerPopoverAuto from "./OverlayTriggerPopoverAuto";

const isMobile = () => window.screen && window.screen.width < 768;

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
	const [mobile, setMobile] = useState(isMobile);
	useEffect(() => {
		const update = () => {
			setMobile(isMobile());
		};
		window.addEventListener("optimizedResize", update);
		return () => {
			window.removeEventListener("optimizedResize", update);
		};
	}, []);

	const [showModal, setShowModal] = useState(false);

	if (mobile) {
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
