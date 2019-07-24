import PropTypes from "prop-types";
import React from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "reactstrap/lib/Modal";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalFooter from "reactstrap/lib/ModalFooter";

const Confirm = confirmable(({ show, proceed, confirmation }) => {
    return (
        <div>
            <Modal fade={false} isOpen={show} toggle={() => proceed(false)}>
                <ModalBody>{confirmation}</ModalBody>
                <ModalFooter>
                    <button
                        className="btn btn-secondary"
                        onClick={() => proceed(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => proceed(true)}
                    >
                        OK
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
});

Confirm.propTypes = {
    confirmation: PropTypes.string,
};

const confirmFunction = createConfirmation(Confirm);

const confirm = message => {
    return confirmFunction({ confirmation: message });
};

export default confirm;
