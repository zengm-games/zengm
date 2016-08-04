const classNames = require('classnames');
const $ = require('jquery');
const React = require('react');
const g = require('../../globals');
const ui = require('../../ui');
const draft = require('../../core/draft');
const league = require('../../core/league');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {DataTable, DraftAbbrev, NewWindowLink, PlayerNameLabels} = require('../components/index');

async function draftUntilUserOrEnd() {
    ui.updateStatus("Draft in progress...");
    await draft.untilUserOrEnd();
    const draftOrder = await draft.getOrder();

    if (draftOrder.length === 0) {
        ui.updateStatus("Idle");
    }

    ui.realtimeUpdate(["playerMovement"]);
    league.updateLastDbChange();
}

async function draftUser(pid) {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder.shift();
    if (g.userTids.indexOf(pick.tid) >= 0) {
        await draft.selectPlayer(pick, pid);
        await g.dbl.tx("draftOrder", "readwrite", tx => draft.setOrder(tx, draftOrder));
        await draftUntilUserOrEnd();
    } else {
        console.log("ERROR: User trying to draft out of turn.");
    }
}

const viewDrafted = () => {
    $("body, html").animate({scrollLeft: $(document).outerWidth() - $(window).width()}, 250);
};
const viewUndrafted = () => {
    $("body, html").animate({scrollLeft: 0}, 250);
};

const Draft = ({drafted = [], fantasyDraft, started = false, undrafted = [], userTids}) => {
    bbgmViewReact.title('Draft');

    const nextPick = drafted.find(p => p.pid < 0);
    const usersTurn = nextPick && userTids.indexOf(nextPick.draft.tid) >= 0;

    const colsUndrafted = [{
        title: 'Name',
        width: '100%',
        sortType: 'name',
    }, {
        title: 'Pos',
        desc: 'Position',
    }, {
        title: 'Age',
    }, {
        title: 'Ovr',
        desc: 'Overall rating',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'Pot',
        desc: 'Potential rating',
        sortSequence: ['desc', 'asc'],
    }, {
        title: 'Draft',
        sortSequence: [],
    }];

    const rowsUndrafted = undrafted.map(p => {
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels pid={p.pid} injury={p.injury} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels>,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <button className="btn btn-xs btn-primary" disabled={!usersTurn} onClick={() => draftUser(p.pid)}>Draft</button>,
            ],
        };
    });

    const colsDrafted = [{
        title: 'Pick',
        sortType: 'draftPick',
    }, {
        title: 'Team',
    }].concat(colsUndrafted.slice(0, -1));

    const rowsDrafted = drafted.map((p, i) => {
        return {
            key: i,
            data: [
                <span>{p.draft.round}-{p.draft.pick}</span>,
                <DraftAbbrev originalTid={p.draft.originalTid} tid={p.draft.tid} />,
                p.pid >= 0 ? <PlayerNameLabels pid={p.pid} injury={p.injury} skills={p.ratings.skills} watch={p.watch}>{p.name}</PlayerNameLabels> : null,
                p.pid >= 0 ? p.ratings.pos : null,
                p.pid >= 0 ? p.age : null,
                p.pid >= 0 ? p.ratings.ovr : null,
                p.pid >= 0 ? p.ratings.pot : null,
            ],
            classNames: {info: userTids.indexOf(p.draft.tid) >= 0},
        };
    });

    return <div>
        <h1>Draft <NewWindowLink /></h1>

        <p>When your turn in the draft comes up, select from the list of available players on the left.</p>

        {started ? null : <p><button className="btn btn-large btn-success" onClick={draftUntilUserOrEnd}>Start Draft</button></p>}

        <div className="row row-offcanvas row-offcanvas-right">
            <div className="col-sm-6" id="undrafted-col">
                <h2>
                    Undrafted Players
                    <span className="pull-right"><button type="button" className="btn btn-info btn-xs visible-xs" onClick={viewDrafted}>View Drafted</button></span>
                </h2>

                <DataTable
                    cols={colsUndrafted}
                    defaultSort={[4, 'desc']}
                    rows={rowsUndrafted}
                />
            </div>
            <div className="col-sm-6 sidebar-offcanvas" id="drafted-col">
                <h2>
                    Draft Results
                    <span className="pull-right"><button type="button" className="btn btn-info btn-xs visible-xs" onClick={viewUndrafted}>View Undrafted</button></span>
                </h2>

                <DataTable
                    cols={colsDrafted}
                    defaultSort={[0, 'asc']}
                    rows={rowsDrafted}
                />
            </div>
        </div>
    </div>;
};

module.exports = Draft;
