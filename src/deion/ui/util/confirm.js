import PropTypes from "prop-types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { confirmable, createConfirmation } from "react-confirm";
import Modal from "reactstrap/lib/Modal";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalFooter from "reactstrap/lib/ModalFooter";

const Confirm = confirmable(({ show, proceed, confirmation, defaultValue }) => {
    const [controlledValue, setControlledValue] = useState(defaultValue);

    const ok = useCallback(
        () => proceed(defaultValue === undefined ? true : controlledValue),
        [controlledValue, defaultValue, proceed],
    );
    const cancel = useCallback(
        () => proceed(defaultValue === undefined ? false : null),
        [defaultValue, proceed],
    );

    const input = useRef(null);

    useEffect(() => {
        if (input.current) {
            input.current.select();
        }
    }, []);

    return (
        <div>
            <Modal fade={false} isOpen={show} toggle={cancel}>
                <ModalBody>
                    {confirmation}
                    {defaultValue !== undefined ? (
                        <form
                            className="mt-3"
                            onSubmit={event => {
                                event.preventDefault();
                                ok();
                            }}
                        >
                            <input
                                ref={input}
                                type="text"
                                className="form-control"
                                value={controlledValue}
                                onChange={event => {
                                    setControlledValue(event.target.value);
                                }}
                            />
                        </form>
                    ) : null}
                </ModalBody>
                <ModalFooter>
                    <button className="btn btn-secondary" onClick={cancel}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={ok}>
                        OK
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
});

Confirm.propTypes = {
    confirmation: PropTypes.string.isRequired,
    defaultValue: PropTypes.string,
};

const confirmFunction = createConfirmation(Confirm);

// Pass "defaultValue" and it's used as the default value, like window.prompt. Don't pass "defaultValue" and it's like window.confirm.
const confirm = (message, defaultValue) => {
    return confirmFunction({ confirmation: message, defaultValue });
};

export default confirm;
