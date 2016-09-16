import classNames from 'classnames';
import $ from 'jquery';
import React from 'react';
import g from '../../globals';
import * as ui from '../../ui';
import * as draft from '../../core/draft';
import * as league from '../../core/league';
import bbgmViewReact from '../../util/bbgmViewReact';
import getCols from '../../util/getCols';
import * as helpers from '../../util/helpers';
import {DataTable, DraftAbbrev, NewWindowLink, PlayerNameLabels} from '../components';

const viewDrafted = () => {
    $("body, html").animate({scrollLeft: $(document).outerWidth() - $(window).width()}, 250);
};
const viewUndrafted = () => {
    $("body, html").animate({scrollLeft: 0}, 250);
};

class Draft extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            fantasyDrafted: [],
            fantasyDraftedNewPids: [],
        };
    }

    componentWillReceiveProps() {
        if (this.props.fantasyDraft) {
            const newDrafted = this.state.fantasyDraftedNewPids.map((pid, i) => {
                const p = this.props.undrafted.find(p2 => p2.pid === pid);
                p.draft = this.props.drafted[i].draft;
                return p;
            });

            this.setState({
                fantasyDrafted: this.state.fantasyDrafted.concat(newDrafted),
                fantasyDraftedNewPids: [],
            });
        }
    }

    savePids(pids) {
        if (this.props.fantasyDraft) {
            this.setState({
                fantasyDraftedNewPids: this.state.fantasyDraftedNewPids.concat(pids),
            });
        }
    }

    async draftUntilUserOrEnd() {
        ui.updateStatus("Draft in progress...");
        const pids = await draft.untilUserOrEnd();
        this.savePids(pids);
        const draftOrder = await draft.getOrder();

        if (draftOrder.length === 0) {
            ui.updateStatus("Idle");
        }

        ui.realtimeUpdate(["playerMovement"]);
        league.updateLastDbChange();
    }

    async draftUser(pid) {
        const draftOrder = await draft.getOrder();
        const pick = draftOrder.shift();
        if (pick && g.userTids.indexOf(pick.tid) >= 0) {
            this.savePids([pid]);
            await draft.selectPlayer(pick, pid);
            await g.dbl.tx("draftOrder", "readwrite", tx => draft.setOrder(tx, draftOrder));
            await this.draftUntilUserOrEnd();
        } else {
            console.log("ERROR: User trying to draft out of turn.");
        }
    }

    render() {
        const {drafted, fantasyDraft, started, undrafted, userTids} = this.props;

        bbgmViewReact.title('Draft');

        const nextPick = drafted.find(p => p.pid < 0);
        const usersTurn = nextPick && userTids.indexOf(nextPick.draft.tid) >= 0;

        const colsUndrafted = getCols('Name', 'Pos', 'Age', 'Ovr', 'Pot', 'Draft');
        colsUndrafted[0].width = '100%';

        if (fantasyDraft) {
            colsUndrafted.splice(5, 0, ...getCols('Contract', 'PER', 'EWA'));
        }

        const rowsUndrafted = undrafted.map(p => {
            const data = [
                <PlayerNameLabels pid={p.pid} injury={p.injury} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <button className="btn btn-xs btn-primary" disabled={!usersTurn} onClick={() => this.draftUser(p.pid)}>Draft</button>,
            ];

            if (fantasyDraft) {
                data.splice(5, 0,
                    `${helpers.formatCurrency(p.contract.amount, 'M')} thru ${p.contract.exp}`,
                    helpers.round(p.stats.per, 1),
                    helpers.round(p.stats.ewa, 1)
                );
            }

            return {
                key: p.pid,
                data,
            };
        });

        const colsDrafted = getCols('Pick', 'Team').concat(colsUndrafted.slice(0, -1));

        const draftedMerged = fantasyDraft ? this.state.fantasyDrafted.concat(drafted) : drafted;
        const rowsDrafted = draftedMerged.map((p, i) => {
            const data = [
                `${p.draft.round}-${p.draft.pick}`,
                <DraftAbbrev originalTid={p.draft.originalTid} tid={p.draft.tid}>{p.draft.tid} {p.draft.originalTid}</DraftAbbrev>,
                p.pid >= 0 ? <PlayerNameLabels pid={p.pid} injury={p.injury} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels> : null,
                p.pid >= 0 ? p.ratings.pos : null,
                p.pid >= 0 ? p.age : null,
                p.pid >= 0 ? p.ratings.ovr : null,
                p.pid >= 0 ? p.ratings.pot : null,
            ];

            if (fantasyDraft) {
                data.splice(7, 0,
                    p.pid >= 0 ? `${helpers.formatCurrency(p.contract.amount, 'M')} thru ${p.contract.exp}` : null,
                    p.pid >= 0 ? helpers.round(p.stats.per, 1) : null,
                    p.pid >= 0 ? helpers.round(p.stats.ewa, 1) : null
                );
            }

            return {
                key: i,
                data,
                classNames: {info: userTids.indexOf(p.draft.tid) >= 0},
            };
        });

        const buttonClasses = classNames('btn', 'btn-info', 'btn-xs', {'visible-xs': !fantasyDraft});

        const wrapperClasses = classNames('row', 'row-offcanvas', 'row-offcanvas-right', {
            'row-offcanvas-force': fantasyDraft,
            'row-offcanvas-right-force': fantasyDraft,
        });

        const colClass = fantasyDraft ? 'col-xs-12' : 'col-sm-6';
        const undraftedColClasses = classNames(colClass);
        const draftedColClasses = classNames('sidebar-offcanvas', colClass, {'sidebar-offcanvas-force': fantasyDraft});

        return <div>
            <h1>Draft <NewWindowLink /></h1>

            <p>When your turn in the draft comes up, select from the list of available players on the left.</p>

            {started ? null : <p><button className="btn btn-large btn-success" onClick={() => this.draftUntilUserOrEnd()}>Start Draft</button></p>}

            <div className={wrapperClasses}>
                <div className={undraftedColClasses}>
                    <h2>
                        Undrafted Players
                        <span className="pull-right"><button type="button" className={buttonClasses} onClick={viewDrafted}>View Drafted</button></span>
                    </h2>

                    <DataTable
                        cols={colsUndrafted}
                        defaultSort={[4, 'desc']}
                        rows={rowsUndrafted}
                    />
                </div>
                <div className={draftedColClasses}>
                    <h2>
                        Draft Results
                        <span className="pull-right"><button type="button" className={buttonClasses} onClick={viewUndrafted}>View Undrafted</button></span>
                    </h2>

                    <DataTable
                        cols={colsDrafted}
                        defaultSort={[0, 'asc']}
                        rows={rowsDrafted}
                    />
                </div>
            </div>
        </div>;
    }
}

Draft.propTypes = {
    drafted: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    fantasyDraft: React.PropTypes.bool.isRequired,
    started: React.PropTypes.bool.isRequired,
    undrafted: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    userTids: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
};

export default Draft;
