const classNames = require('classnames');
const React = require('react');
const ui = require('../../ui');
const draft = require('../../core/draft');
const bbgmViewReact = require('../../util/bbgmViewReact');
const helpers = require('../../util/helpers');
const {DraftAbbrev, NewWindowLink, PlayerNameLabels} = require('../components/index');

async function draftUntilUserOrEnd() {
    ui.updateStatus("Draft in progress...");
    const pids = await draft.untilUserOrEnd();
    const draftOrder = await draft.getOrder();

    if (draftOrder.length === 0) {
        ui.updateStatus("Idle");
    }

    updateDraftTables(pids);
}

async function draftUser(pid) {
    const draftOrder = await draft.getOrder();
    const pick = draftOrder.shift();
    if (g.userTids.indexOf(pick.tid) >= 0) {
        await draft.selectPlayer(pick, pid);
        await g.dbl.tx("draftOrder", "readwrite", tx => draft.setOrder(tx, draftOrder));
        await draftUntilUserOrEnd();
    }

    console.log("ERROR: User trying to draft out of turn.");
}

const Draft = ({drafted, fantasyDraft, started, undrafted, usersTurn, userTids}) => {
    bbgmViewReact.title('Draft');

    const colsUndrafted = [{
        title: 'Name',
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
    }];

    const rowsUndrafted = undrafted.map(p => {
        return {
            key: p.pid,
            data: [
                <PlayerNameLabels pid={p.pid} name={p.name} injury={p.injury} skills={p.ratings.skills} watch={p.watch} />,
                p.ratings.pos,
                p.age,
                p.ratings.ovr,
                p.ratings.pot,
                <button className="btn btn-xs btn-primary" onClick={() => draftUser(p.pid)}>Draft</button>,
            ],
        };
    });

    const colsDrafted = [{
        title: 'Pick',
    }, {
        title: 'Team',
    }].concat(colsUndrafted);

    const rowsDrafted = drafted.map(p => {
        return {
            key: `${draft.round}-${draft.pick}`,
            data: [
                <span>{draft.round}-{draft.pick}</span>,
                <DraftAbbrev originalTid={draft.originalTid} tid={draft.tid} />,
                p.pid >= 0 ? <PlayerNameLabels pid={p.pid} name={p.name} injury={p.injury} skills={p.ratings.skills} watch={p.watch} /> : null,
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
                    <span className="pull-right"><button type="button" className="btn btn-info btn-xs visible-xs" id="view-drafted">View Drafted</button></span>
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
                    <span className="pull-right"><button type="button" className="btn btn-info btn-xs visible-xs" id="view-undrafted">View Undrafted</button></span>
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

module.exports = Draft;
