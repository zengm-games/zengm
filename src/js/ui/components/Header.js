// @flow

import * as React from "react";

// Ensure there is enough room to display 160px wide ad with 15px margins next to 1200px wide container
const widthCutoff = 1200 + 190;

const updateSkyscraperDisplay = () => {
    const div = document.getElementById("bbgm-ads-skyscraper");
    if (div) {
        const documentElement = document.documentElement;
        if (documentElement) {
            const width = documentElement.clientWidth;
            div.style.display = width < widthCutoff ? "none" : "block";
        } else {
            div.style.display = "none";
        }
    }
};

// https://developer.mozilla.org/en-US/docs/Web/Events/resize
let running = false;
const resizeListener = () => {
    if (running) {
        return;
    }
    running = true;
    window.requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent("optimizedResize"));
        running = false;
    });
};

class Header extends React.Component<{}> {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate() {
        return false;
    }

    componentDidMount() {
        updateSkyscraperDisplay();

        window.addEventListener("resize", resizeListener);
        window.addEventListener("optimizedResize", updateSkyscraperDisplay);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", resizeListener);
        window.removeEventListener("optimizedResize", updateSkyscraperDisplay);
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
            // banner-ad class is so ad blockers remove it cleanly. I'm so nice!
            <div>
                <div
                    className="banner-ad"
                    id="bbgm-ads-top"
                    style={{
                        display: "none",
                        textAlign: "center",
                        minHeight: "95px",
                        marginTop: "1em",
                    }}
                />
                <div className="banner-ad skyscraper-wrapper">
                    <div
                        id="bbgm-ads-skyscraper"
                        style={{
                            display: "none",
                        }}
                    />
                </div>
                {embedInfo}
            </div>
        );
    }
}

export default Header;
