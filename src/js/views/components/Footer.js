const React = require('react');

class Footer extends React.Component {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate() {
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    render() {
        return <div>
            <p className="clearfix" />

            <div id="banner-ad-bottom-wrapper" />

            <hr />

            <footer>
                <p>
                    <a href="https://basketball-gm.com/about/" rel="noopener noreferrer" target="_blank">About</a> ·{' '}
                    <a href="https://basketball-gm.com/advertise/" rel="noopener noreferrer" target="_blank">Advertise</a> ·{' '}
                    <a href="https://basketball-gm.com/blog/" rel="noopener noreferrer" target="_blank">Blog</a> ·{' '}
                    <a href="https://basketball-gm.com/contact/" rel="noopener noreferrer" target="_blank">Contact</a> ·{' '}
                    <a href="https://basketball-gm.com/share/" rel="noopener noreferrer" target="_blank">Share</a><br />
                </p>
                <p className="rev">v3.6 · {window.bbgmVersion}</p>
            </footer>
        </div>;
    }
}

module.exports = Footer;
