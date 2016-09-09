const React = require('react');
const Modal = require('react-bootstrap/lib/Modal');

const NagModal = ({close, show}) => {
console.log('show', show);

    return <Modal show={show} onHide={close}>
        <Modal.Header closeButton>
            <Modal.Title>Please support Basketball GM!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <p>Basketball GM is completely free. There will never be any <a href="http://en.wikipedia.org/wiki/Freemium" target="_blank">"freemium"</a> or <a href="http://en.wikipedia.org/wiki/Free-to-play" target="_blank">"pay-to-win"</a> bullshit here. Why? Because if a game charges you money for power-ups, the developer makes more money if they make their game frustratingly annoying to play without power-ups. Because of this, <b>freemium games always suck</b>.</p>
            <p>If you want to support Basketball GM continuing to be a non-sucky game, sign up for Basketball GM Gold! It's only <b>$5/month</b>. What do you get? More like, what don't you get? You get no new features, no new improvements, no new anything. Just <b>no more ads</b>. That's it. Why? For basically the same reason I won't make Basketball GM freemium. I don't want the free version to become a crippled advertisement for the pay version. If you agree that the world is a better place when anyone anywhere can play Basketball GM, sign up for Basketball GM Gold today!</p>
            <div class="text-center">
                <a href="/account" class="btn btn-primary" data-dismiss="modal">Sign up for Basketball GM Gold from your account page</a>
            </div>
        </Modal.Body>
    </Modal>;
};

module.exports = NagModal;
