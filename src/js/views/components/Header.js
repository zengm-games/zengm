const React = require('react');

class Header extends React.Component {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate() {
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    render() {
        return <div id="banner-ad-top-wrapper" />;
    }
}

module.exports = Header;
