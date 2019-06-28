// @flow

import PropTypes from "prop-types";
import React from "react";
import Modal from "reactstrap/lib/Modal";
import ModalBody from "reactstrap/lib/ModalBody";
import ModalHeader from "reactstrap/lib/ModalHeader";
import { helpers } from "../util";

type Props = {
    close: () => void,
    show: boolean,
};

const sport = helpers.upperCaseFirstLetter(process.env.SPORT);
const otherSport =
    process.env.SPORT === "basketball" ? "Football" : "Basketball";

const NagModal = ({ close, show }: Props) => {
    return (
        <Modal isOpen={show} toggle={close}>
            <ModalHeader toggle={close}>Please support {sport} GM</ModalHeader>
            <ModalBody>
                <p>
                    {sport} GM is completely free. There will never be any{" "}
                    <a
                        href="http://en.wikipedia.org/wiki/Freemium"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        "freemium"
                    </a>{" "}
                    or{" "}
                    <a
                        href="http://en.wikipedia.org/wiki/Free-to-play"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        "pay-to-win"
                    </a>{" "}
                    bullshit here. Why? Because if a game charges you money for
                    power-ups, the developer makes more money if they make their
                    game frustratingly annoying to play without power-ups.
                    Because of this, <b>freemium games always suck</b>.
                </p>
                <p>
                    If you want to support {sport} GM continuing to be a
                    non-sucky game, sign up for GM Gold! It's only{" "}
                    <b>$5/month</b>. What do you get? More like, what don't you
                    get? You get no new features, no new improvements, no new
                    anything. Just <b>no more ads</b>, both here and on{" "}
                    <a
                        href={`https://play.${otherSport.toLowerCase()}-gm.com/`}
                    >
                        {otherSport} GM
                    </a>
                    . That's it. Why? For basically the same reason I won't make{" "}
                    {sport} GM freemium. I don't want the free version to become
                    a crippled advertisement for the pay version. If you agree
                    that the world is a better place when anyone anywhere can
                    play {sport} GM and {otherSport} GM, sign up for GM Gold
                    today!
                </p>
                <div className="text-center">
                    <a
                        href="/account"
                        className="btn btn-primary"
                        onClick={close}
                    >
                        Sign up for GM Gold from your account page
                    </a>
                </div>
            </ModalBody>
        </Modal>
    );
};

NagModal.propTypes = {
    close: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired,
};

export default NagModal;
