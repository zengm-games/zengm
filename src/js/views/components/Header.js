const React = require('react');

class Footer extends React.Component {
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return <div id="banner-ad-top-wrapper" />;
    }
}

module.exports = Footer;
