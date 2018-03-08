// @flow

import * as React from "react";

class Header extends React.Component<{}> {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate() {
        return false;
    }

    // eslint-disable-next-line class-methods-use-this
    render() {
        const embedInfo = window.inIframe ? (
            <div
                className="alert alert-success"
                style={{ margin: "1em 0 0 0" }}
            >
                <b>Welcome to Basketball GM!</b> Basketball GM is a basketball
                management simulator. It's kind of like the fantasy basketball
                you play here at Sports.ws, except it's a single player game and
                you can simulate games (or hundreds of seasons) at your own
                pace. Think of it as fantasy fantasy basketball. Give it a try
                here, and if you're feeling a bit claustrophobic,{" "}
                <a
                    href="https://play.basketball-gm.com"
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    open Basketball GM in a new browser window
                </a>{" "}
                and continue playing.
            </div>
        ) : null;

        return (
            <div>
                <div id="bbgm-ads-top" style={{
                    display: "none",
                    textAlign: "center",
                    minHeight: "95px",
                    marginTop: "1em",
                }} />
                {embedInfo}
            </div>
        );
    }
}

export default Header;
