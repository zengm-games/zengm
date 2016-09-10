const React = require('react');

class Footer extends React.Component {
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div>
            <p className="clearfix" />

            <div id="banner-ad-bottom-wrapper" />

            <hr />

            <footer>
                <p>
                    <a href="https://basketball-gm.com/about/" target="_blank">About</a> ·{' '}
                    <a href="https://basketball-gm.com/advertise/" target="_blank">Advertise</a> ·{' '}
                    <a href="https://basketball-gm.com/blog/" target="_blank">Blog</a> ·{' '}
                    <a href="https://basketball-gm.com/contact/" target="_blank">Contact</a> ·{' '}
                    <a href="https://basketball-gm.com/share/" target="_blank">Share</a><br />
                </p>
                <p className="rev">v3.6 · {window.bbgmVersion}</p>
            </footer>
        </div>;
    }
}

module.exports = Footer;
