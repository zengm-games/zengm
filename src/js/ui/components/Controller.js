// @flow

import PropTypes from "prop-types";
import * as React from "react";
import { g } from "../../common";
import { ads, emitter, realtimeUpdate, setTitle, toWorker } from "../util";
import {
    Footer,
    Header,
    LeagueWrapper,
    MultiTeamMenu,
    NagModal,
    NavBar,
} from "../components";
import type {
    GetOutput,
    Option,
    PageCtx,
    UpdateEvents,
} from "../../common/types";

type Props = {
    Component: any,
    data: any,
    updating: boolean,
};

class LeagueContent extends React.Component<Props> {
    // eslint-disable-next-line class-methods-use-this
    shouldComponentUpdate(nextProps) {
        return !nextProps.updating;
    }

    render() {
        const { Component, data } = this.props;

        return <Component {...data} />;
    }
}

LeagueContent.propTypes = {
    Component: PropTypes.func.isRequired,
    data: PropTypes.object.isRequired,
    updating: PropTypes.bool.isRequired,
};

type Args = {
    Component: any,
    id: string,
    inLeague: boolean,
    get: (ctx: PageCtx) => ?GetOutput,
};

type State = {
    Component: any,
    idLoaded?: string,
    idLoading?: string,
    inLeague: boolean,
    data: { [key: string]: any },
    multiTeam: {
        userTid: number,
        userTids: number[],
    },
    showNagModal: boolean,
    topMenu: {
        email?: string,
        godMode: boolean,
        goldUntil: number,
        goldCancelled: boolean,
        hasViewedALeague: boolean,
        lid?: number,
        options: Option[],
        phaseText: string,
        popup: boolean,
        statusText: string,
        username?: string,
    },
};

class Controller extends React.Component<{}, State> {
    closeNagModal: Function;
    get: Function;
    showAd: Function;
    updatePage: Function;
    updateMultiTeam: Function;
    updateState: Function;
    updateTopMenu: Function;

    constructor(props: {}) {
        super(props);
        this.state = {
            Component: undefined,
            idLoaded: undefined,
            idLoading: undefined,
            inLeague: false,
            data: {},
            multiTeam: {
                userTid: g.userTid,
                userTids: g.userTids,
            },
            showNagModal: false,
            topMenu: {
                email: undefined,
                godMode: !!g.godMode,
                goldUntil: 0,
                goldCancelled: false,
                hasViewedALeague: !!localStorage.getItem("hasViewedALeague"),
                lid: undefined,
                options: [],
                phaseText: "",
                popup: window.location.search === "?w=popup",
                statusText: "",
                username: undefined,
            },
        };
        this.closeNagModal = this.closeNagModal.bind(this);
        this.get = this.get.bind(this);
        this.showAd = this.showAd.bind(this);
        this.updatePage = this.updatePage.bind(this);
        this.updateMultiTeam = this.updateMultiTeam.bind(this);
        this.updateState = this.updateState.bind(this);
        this.updateTopMenu = this.updateTopMenu.bind(this);
    }

    componentDidMount() {
        emitter.on("get", this.get);
        emitter.on("showAd", this.showAd);
        emitter.on("updateMultiTeam", this.updateMultiTeam);
        emitter.on("updateState", this.updateState);
        emitter.on("updateTopMenu", this.updateTopMenu);

        if (this.state.topMenu.popup && document.body) {
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
        emitter.removeListener("showAd", this.showAd);
        emitter.removeListener("updateMultiTeam", this.updateMultiTeam);
        emitter.removeListener("updateState", this.updateState);
        emitter.removeListener("updateTopMenu", this.updateTopMenu);
    }

    closeNagModal() {
        this.setState({
            showNagModal: false,
        });
    }

    async get(args: Args, ctx: PageCtx) {
        try {
            const updateEvents =
                ctx !== undefined && ctx.bbgm.updateEvents !== undefined
                    ? ctx.bbgm.updateEvents
                    : [];
            const newLidInt = parseInt(ctx.params.lid, 10);
            const newLid = Number.isNaN(newLidInt) ? undefined : newLidInt;

            if (args.inLeague) {
                if (newLid !== this.state.topMenu.lid) {
                    await toWorker(
                        "beforeViewLeague",
                        newLid,
                        this.state.topMenu.lid,
                    );
                }
            } else {
                // eslint-disable-next-line no-lonely-if
                if (this.state.topMenu.lid !== undefined) {
                    await toWorker("beforeViewNonLeague");
                    this.updateTopMenu({
                        lid: undefined,
                    });
                }
            }

            // No good reason for this to be brought back to the UI, since inputs are sent back to the worker below.
            // ctxBBGM is hacky!
            const ctxBBGM = Object.assign({}, ctx.bbgm);
            delete ctxBBGM.cb; // Can't send function to worker
            const inputs = await toWorker(
                `processInputs.${args.id}`,
                ctx.params,
                ctxBBGM,
            );

            if (typeof inputs.redirectUrl === "string") {
                await realtimeUpdate([], inputs.redirectUrl);
            } else {
                await this.updatePage(args, inputs, updateEvents);
            }
        } catch (err) {
            ctx.bbgm.err = err;
        }

        if (
            ctx !== undefined &&
            ctx.bbgm !== undefined &&
            ctx.bbgm.cb !== undefined
        ) {
            ctx.bbgm.cb();
        }
    }

    showAd(type: "modal", autoPlaySeasons: number) {
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
            const currentTimestamp = Math.floor(Date.now() / 1000);
            if (currentTimestamp <= this.state.topMenu.goldUntil) {
                return;
            }

            const r = Math.random();
            if (r < 0.96) {
                ads.showGcs();
            } else {
                ads.showModal();
            }
        }
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
            (this.state.idLoaded !== args.id &&
                this.state.idLoading !== args.id) ||
            (this.state.idLoaded === args.id &&
                this.state.idLoading !== args.id &&
                this.state.idLoading !== undefined)
        ) {
            if (!updateEvents.includes("firstRun")) {
                updateEvents.push("firstRun");
            }

            prevData = {};
        } else if (this.state.idLoading === args.id) {
            // If this view is already loading, no need to update (in fact, updating can cause errors because the firstRun updateEvent is not set and thus some first-run-defined view model properties might be accessed).
            return;
        } else {
            prevData = this.state.data;
        }

        this.setState({
            idLoading: args.id,
        });

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
                idLoading: undefined,
            });
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
                        <div>
                            <h1>Error</h1>
                            <h2>{errorMessage}</h2>
                        </div>
                    );
                };
            }
        }

        const vars = {
            Component,
            inLeague: args.inLeague,
            data: Object.assign(prevData, ...results),
        };

        if (vars.data && vars.data.redirectUrl !== undefined) {
            // Reset idLoading, otherwise it will think loading is already in progress on redirect
            this.setState({
                idLoading: undefined,
            });

            await realtimeUpdate([], vars.data.redirectUrl);
            return;
        }

        this.setState(vars);

        if (this.state.idLoading === args.id) {
            this.setState(
                {
                    idLoaded: args.id,
                    idLoading: undefined,
                },
                () => {
                    // Scroll to top
                    if (
                        updateEvents.length === 1 &&
                        updateEvents[0] === "firstRun"
                    ) {
                        window.scrollTo(window.pageXOffset, 0);
                    }
                },
            );
        }
    }

    updateMultiTeam() {
        this.setState({
            multiTeam: {
                userTid: g.userTid,
                userTids: g.userTids,
            },
        });
    }

    updateState(obj: State) {
        this.setState(obj);
    }

    updateTopMenu(obj: {
        email?: string,
        godMode?: boolean,
        goldCancelled?: boolean,
        goldUntil?: number,
        lid?: number,
        options?: Option[],
        phaseText?: string,
        statusText?: string,
        username?: string,
    }) {
        this.setState({
            topMenu: Object.assign(this.state.topMenu, obj),
        });
    }

    render() {
        const {
            Component,
            data,
            idLoaded,
            idLoading,
            inLeague,
            multiTeam,
            topMenu,
        } = this.state;

        const updating = idLoading !== undefined;

        let contents;
        let pageId;
        if (!Component) {
            contents = <h1 style={{ textAlign: "center" }}>Loading...</h1>; // Nice, aligned with splash screen
        } else if (!inLeague) {
            contents = <Component {...data} />;
        } else {
            pageId = idLoading !== undefined ? idLoading : idLoaded;

            contents = (
                <div>
                    <LeagueWrapper lid={topMenu.lid} pageId={pageId}>
                        <LeagueContent
                            Component={Component}
                            data={data}
                            updating={updating}
                        />
                    </LeagueWrapper>
                    <MultiTeamMenu {...multiTeam} />
                </div>
            );
        }

        return (
            <div className="container">
                <NavBar {...topMenu} pageId={pageId} updating={updating} />
                <Header />
                <div id="screenshot-nonleague" style={{ minHeight: "300px" }}>
                    {contents}
                </div>
                <Footer />
                <NagModal
                    close={this.closeNagModal}
                    show={this.state.showNagModal}
                />
            </div>
        );
    }
}

export default Controller;
