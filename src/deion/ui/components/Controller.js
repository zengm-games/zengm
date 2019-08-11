// @flow

import PropTypes from "prop-types";
import React from "react";
import { Provider } from "unstated";
import {
    ads,
    emitter,
    local,
    realtimeUpdate,
    setTitle,
    toWorker,
} from "../util";
import ErrorBoundary from "./ErrorBoundary";
import Footer from "./Footer";
import Header from "./Header";
import MultiTeamMenu from "./MultiTeamMenu";
import NagModal from "./NagModal";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import type {
    GetOutput,
    RouterContext,
    UpdateEvents,
} from "../../common/types";

type Props = {
    children: any,
    updating: boolean,
};

class LeagueContent extends React.Component<Props> {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate(nextProps) {
        return !nextProps.updating;
    }

    render() {
        return this.props.children;
    }
}

LeagueContent.propTypes = {
    updating: PropTypes.bool.isRequired,
};

const showAd = (type: "modal", autoPlaySeasons: number) => {
    if (type === "modal") {
        if (!window.enableLogging) {
            return;
        }

        if (window.inIframe) {
            return;
        }

        // No ads during multi season auto sim
        if (autoPlaySeasons > 0) {
            return;
        }

        // No ads for Gold members
        if (local.state.gold) {
            return;
        }

        const r = Math.random();
        if (r < 0.96) {
            ads.showGcs();
        } else {
            ads.showModal();
        }
    }
};

type Args = {
    Component: any,
    id: string,
    inLeague: boolean,
    get: (ctx: RouterContext) => ?GetOutput,
};

type State = {
    Component: any,
    loading: boolean,
    inLeague: boolean,
    data: { [key: string]: any },
    showNagModal: boolean,
};

class Controller extends React.Component<{}, State> {
    closeNagModal: Function;

    get: Function;

    updatePage: Function;

    updateState: Function;

    idLoaded: string | void;

    idLoading: string | void;

    constructor(props: {}) {
        super(props);
        this.state = {
            Component: undefined,
            loading: false,
            inLeague: false,
            data: {},
            showNagModal: false,
        };
        this.idLoaded = undefined;
        this.idLoading = undefined;

        this.closeNagModal = this.closeNagModal.bind(this);
        this.get = this.get.bind(this);
        this.updatePage = this.updatePage.bind(this);
        this.updateState = this.updateState.bind(this);
    }

    componentDidMount() {
        emitter.on("get", this.get);
        emitter.on("showAd", showAd);
        emitter.on("updateState", this.updateState);

        if (local.state.popup && document.body) {
            if (document.body) {
                document.body.style.paddingTop = "0";
            }

            const css = document.createElement("style");
            css.type = "text/css";
            css.innerHTML = ".new_window { display: none }";
            if (document.body) {
                document.body.appendChild(css);
            }
        }
    }

    componentWillUnmount() {
        emitter.removeListener("get", this.get);
        emitter.removeListener("showAd", showAd);
        emitter.removeListener("updateState", this.updateState);
    }

    closeNagModal() {
        this.setState({
            showNagModal: false,
        });
    }

    async get(
        args: Args,
        ctx: RouterContext,
        resolve: () => void,
        reject: Error => void,
    ) {
        try {
            const updateEvents =
                ctx.state.updateEvents !== undefined
                    ? ctx.state.updateEvents
                    : [];
            const newLidInt = parseInt(ctx.params.lid, 10);
            const newLid = Number.isNaN(newLidInt) ? undefined : newLidInt;

            if (args.inLeague) {
                if (newLid !== local.state.lid) {
                    await toWorker("beforeViewLeague", newLid, local.state.lid);
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (local.state.lid !== undefined) {
                    await toWorker("beforeViewNonLeague");
                    local.updateGameAttributes({
                        lid: undefined,
                    });
                }
            }

            // No good reason for this to be brought back to the UI, since inputs are sent back to the worker below.
            // ctxBBGM is hacky!
            const ctxBBGM = { ...ctx.state };
            delete ctxBBGM.err; // Can't send error to worker
            const inputs = await toWorker(
                `processInputs.${args.id}`,
                ctx.params,
                ctxBBGM,
            );

            if (typeof inputs.redirectUrl === "string") {
                await realtimeUpdate([], inputs.redirectUrl, {}, true);
            } else {
                await this.updatePage(args, inputs, updateEvents);
            }
        } catch (err) {
            reject(err);
        }

        resolve();
    }

    async updatePage(
        args: Args,
        inputs: GetOutput,
        updateEvents: UpdateEvents,
    ) {
        let prevData;

        // Reset league content and view model only if it's:
        // (1) if it's not loaded and not loading yet
        // (2) loaded, but loading something else
        if (
            (this.idLoaded !== args.id && this.idLoading !== args.id) ||
            (this.idLoaded === args.id &&
                this.idLoading !== args.id &&
                this.idLoading !== undefined)
        ) {
            if (!updateEvents.includes("firstRun")) {
                updateEvents.push("firstRun");
            }

            prevData = {};
        } else if (this.idLoading === args.id) {
            // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
            return;
        } else {
            prevData = this.state.data;
        }

        this.setState({
            loading: true,
        });
        this.idLoading = args.id;

        // Resolve all the promises before updating the UI to minimize flicker
        const results = await toWorker(
            "runBefore",
            args.id,
            inputs,
            updateEvents,
            prevData,
        );

        // If results is undefined, it means the league wasn't loaded yet at the time of the request, likely because another league was opening in another tab at the same time. So stop now and wait until we get a signal that there is a new league.
        if (results === undefined) {
            this.setState({
                loading: false,
            });
            this.idLoading = undefined;
            return;
        }

        let Component = args.Component;
        for (const result of results) {
            if (
                result &&
                Object.keys(result).length === 1 &&
                result.hasOwnProperty("errorMessage")
            ) {
                Component = ({ errorMessage }: { errorMessage: string }) => {
                    setTitle("Error");
                    return (
                        <>
                            <h1>Error</h1>
                            <h2>{errorMessage}</h2>
                        </>
                    );
                };
            }
        }

        const vars = {
            Component,
            data: Object.assign(prevData, ...results),
            loading: false,
            inLeague: args.inLeague,
        };

        if (vars.data && vars.data.redirectUrl !== undefined) {
            // Reset idLoading, otherwise it will think loading is already in progress on redirect
            this.setState({
                loading: false,
            });
            this.idLoading = undefined;

            await realtimeUpdate([], vars.data.redirectUrl, {}, true);
            return;
        }

        // Make sure user didn't navigate to another page while async stuff was happening
        if (this.idLoading === args.id) {
            this.setState(vars);

            this.idLoaded = args.id;
            this.idLoading = undefined;

            // Scroll to top if this load came from user clicking a link
            if (updateEvents.length === 1 && updateEvents[0] === "firstRun") {
                window.scrollTo(window.pageXOffset, 0);
            }
        }
    }

    updateState(obj: State) {
        this.setState(obj);
    }

    render() {
        const { Component, data, loading, inLeague } = this.state;

        let contents;
        const pageID = this.idLoading || this.idLoaded; // idLoading, idLoaded, or undefined
        if (!Component) {
            contents = <h1 style={{ textAlign: "center" }}>Loading...</h1>; // Nice, aligned with splash screen
        } else if (!inLeague) {
            contents = <Component {...data} />;
        } else {
            contents = (
                <>
                    <LeagueContent updating={loading}>
                        <Component {...data} />
                    </LeagueContent>
                    <MultiTeamMenu />
                </>
            );
        }

        return (
            <Provider>
                <NavBar pageID={pageID} updating={loading} />
                <div className="bbgm-container">
                    <Header />
                    <SideBar pageID={pageID} />
                    <div className="p402_premium" id="actual-content">
                        <div id="actual-actual-content">
                            <ErrorBoundary key={pageID}>
                                {contents}
                            </ErrorBoundary>
                        </div>
                        <Footer />
                    </div>
                    <NagModal
                        close={this.closeNagModal}
                        show={this.state.showNagModal}
                    />
                </div>
            </Provider>
        );
    }
}

export default Controller;
