const React = require('react');
const g = require('../../globals');
const {negotiate, tradeFor} = require('../../util/actions');
const bbgmViewReact = require('../../util/bbgmViewReact');
const getCols = require('../../util/getCols');
const helpers = require('../../util/helpers');
const {DataTable, NewWindowLink, SkillsBlock, WatchBlock} = require('../components/index');

const RatingsOverview = ({ratings}) => {
    const r = ratings.length - 1;

    return <div>
        <div className="row">
            <div className="col-xs-6">
                <h2>Overall: {ratings[r].ovr}</h2>
            </div>
            <div className="col-xs-6">
                <h2 className="pull-right">Potential: {ratings[r].pot}</h2>
            </div>
        </div>
        <div className="row">
            <div className="col-xs-4">
                <b>Physical</b><br />
                Height: {ratings[r].hgt}<br />
                Strength: {ratings[r].stre}<br />
                Speed: {ratings[r].spd}<br />
                Jumping: {ratings[r].jmp}<br />
                Endurance: {ratings[r].endu}
            </div>
            <div className="col-xs-4">
                <b>Shooting</b><br />
                Inside: {ratings[r].ins}<br />
                Dunks/Layups: {ratings[r].dnk}<br />
                Free Throws: {ratings[r].ft}<br />
                Two Pointers: {ratings[r].fg}<br />
                Three Pointers: {ratings[r].tp}
            </div>
            <div className="col-xs-4">
                <b>Skill</b><br />
                Blocks: {ratings[r].blk}<br />
                Steals: {ratings[r].stl}<br />
                Dribbling: {ratings[r].drb}<br />
                Passing: {ratings[r].pss}<br />
                Rebounding: {ratings[r].reb}
            </div>
        </div>
    </div>;
};

const Player = ({events = [], feats = [], freeAgent, godMode, injured, player = {awardsGrouped: [], born: {}, draft: {}, pid: 0, ratings: [{season: 0, skills: []}], salaries: [], watch: false}, retired, showContract, showTradeFor}) => {
    bbgmViewReact.title(player.name);

    let draftInfo = null;
    if (player.draft.round) {
        draftInfo = <div>
            Draft: <a href={helpers.leagueUrl(['draft_summary', player.draft.year])}>{player.draft.year}</a> - Round {player.draft.round} (Pick {player.draft.pick}) by {player.draft.abbrev}<br />
        </div>;
    } else {
        draftInfo = <div>Undrafted: {player.draft.year}<br /></div>;
    }

    let contractInfo = null;
    if (showContract) {
        contractInfo = <div>
            {freeAgent ? 'Asking for' : 'Contract'}: {helpers.formatCurrency([player.contract.amount, 'M'])}/yr thru {player.contract.exp}<br />
        </div>;
    }

    let statusInfo = null;
    if (!retired) {
        statusInfo = <div>
            {injured ? <span className="label label-danger label-injury" style={{marginLeft: 0}} data-bind="attr: {title: player.injury.type() + ' (out ' + player.injury.gamesRemaining() + ' more games)'}">{player.injury.gamesRemaining}</span> : null}
            <SkillsBlock
                className={injured ? null : 'skills-alone'}
                skills={player.ratings[player.ratings.length - 1].skills}
            />
            <WatchBlock
                pid={player.pid}
                watch={player.watch}
            />
            <br />
        </div>;
    }

    return <div>
        <div className="row">
            <div className="col-sm-6">
                <h1>{player.name} <NewWindowLink /></h1>
                <div id="picture" className="player-picture"></div>
                <div style={{float: 'left'}}>
                    <strong>{player.ratings[player.ratings.length - 1].pos}, {player.teamRegion} {player.teamName}</strong><br />
                    Height: {player.hgtFt}'{player.hgtIn}"<br />
                    Weight: {player.weight} lbs<br />
                    Born: {player.born.year} - {player.born.loc}<br />
                    {!player.diedYear ? <div>Age: {player.age}<br /></div> : <div>Died: {player.diedYear}<br /></div>}
                    {draftInfo}
                    {player.college && player.college !== "" ? <div>College: {player.college}<br /></div> : null}
                    {contractInfo}
                    {godMode ? <div><a href={helpers.leagueUrl(['customize_player', player.pid])} className="god-mode god-mode-text">Edit Player</a><br /></div> : null}
                    {statusInfo}
                </div>
            </div>

            <div className="visible-xs clearfix"></div>

            <div className="col-sm-6" style={{whiteSpace: 'nowrap'}}>
                {!retired ? <RatingsOverview ratings={player.ratings} /> : null}
            </div>
        </div>

        <p></p>

        {
            showTradeFor
        ?
            <span title={player.untradableMsg}>
                <button
                    className="btn btn-default"
                    disabled={player.untradable}
                    onClick={() => tradeFor({pid: player.pid})}
                >Trade For</button>
            </span>
        :
            null
        }
        {
            freeAgent
        ?
                <button
                    className="btn btn-default"
                    onClick={() => negotiate(player.pid)}
                >Sign Free Agent</button>
        :
            null
        }

        <h2>Regular Season</h2>
        <h3>Stats</h3>
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-clickable-rows" id="player_stats">
                <thead>
                    <tr><th colspan="6"></th><th colspan="3" title="Field Goals">FG</th><th colspan="3" title="Three-Pointers">3PT</th><th colspan="3" title="Free Throws">FT</th><th colspan="3" title="Rebounds">Reb</th><th colspan="10"></th></tr>
                    <tr><th>Year</th><th>Team</th><th>Age</th><th title="Games Played">GP</th><th title="Games Started">GS</th><th title="Minutes">Min</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Offensive">Off</th><th title="Defensive">Def</th><th title="Total">Tot</th><th title="Assists">Ast</th><th title="Turnovers">TO</th><th title="Steals">Stl</th><th title="Blocks">Blk</th><th title="Blocks Against">BA</th><th title="Personal Fouls">PF</th><th title="Points">Pts</th><th title="Plus-Minus">+/-</th><th title="Player Efficiency Rating">PER</th><th title="Estimated Wins Added">EWA</th></tr>
                </thead>
                <tbody data-bind="foreach: player.stats">
                    <tr><td><a href="#" data-bind="text: season"></a></td><td><a data-bind="text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}"></a></td><td data-bind="text: age"></td><td data-bind="text: gp"></td><td data-bind="text: gs"></td><td data-bind="round: [min, 1]"></td><td data-bind="round: [fg, 1]"></td><td data-bind="round: [fga, 1]"></td><td data-bind="round: [fgp, 1]"></td><td data-bind="round: [tp, 1]"></td><td data-bind="round: [tpa, 1]"></td><td data-bind="round: [tpp, 1]"></td><td data-bind="round: [ft, 1]"></td><td data-bind="round: [fta, 1]"></td><td data-bind="round: [ftp, 1]"></td><td data-bind="round: [orb, 1]"></td><td data-bind="round: [drb, 1]"></td><td data-bind="round: [trb, 1]"></td><td data-bind="round: [ast, 1]"></td><td data-bind="round: [tov, 1]"></td><td data-bind="round: [stl, 1]"></td><td data-bind="round: [blk, 1]"></td><td data-bind="round: [ba, 1]"></td><td data-bind="round: [pf, 1]"></td><td data-bind="round: [pts, 1]"></td><td data-bind="plusMinus: [pm, 1]"></td><td data-bind="round: [per, 1]"></td><td data-bind="round: [ewa, 1]"></td></tr>
                </tbody>
                <tfoot data-bind="with: player.careerStats">
                        <tr><th>Career</th><th></th><th></th><th data-bind="text: gp"></th><th data-bind="text: gs"></th><th data-bind="round: [min, 1]"></th><th data-bind="round: [fg, 1]"></th><th data-bind="round: [fga, 1]"></th><th data-bind="round: [fgp, 1]"></th><th data-bind="round: [tp, 1]"></th><th data-bind="round: [tpa, 1]"></th><th data-bind="round: [tpp, 1]"></th><th data-bind="round: [ft, 1]"></th><th data-bind="round: [fta, 1]"></th><th data-bind="round: [ftp, 1]"></th><th data-bind="round: [orb, 1]"></th><th data-bind="round: [drb, 1]"></th><th data-bind="round: [trb, 1]"></th><th data-bind="round: [ast, 1]"></th><th data-bind="round: [tov, 1]"></th><th data-bind="round: [stl, 1]"></th><th data-bind="round: [blk, 1]"></th><th data-bind="round: [ba, 1]"></th><th data-bind="round: [pf, 1]"></th><th data-bind="round: [pts, 1]"></th><th data-bind="plusMinus: [pm, 1]"></th><th data-bind="round: [per, 1]"></th><th data-bind="round: [ewa, 1]"></th></tr>
                </tfoot>
            </table>
        </div>

        <h3>Shot Locations</h3>
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-clickable-rows" id="player_stats">
                <thead>
                    <tr><th colspan="6"></th><th colspan="3" title="At Rim">At Rim</th><th colspan="3" title="Low Post">Low Post</th><th colspan="3" title="Mid-Range">Mid-Range</th><th colspan="3" title="Three-Pointers">3PT</th></tr>
                    <tr><th>Year</th><th>Team</th><th>Age</th><th title="Games Played">GP</th><th title="Games Started">GS</th><th title="Minutes">Min</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th></tr>
                </thead>
                <tbody data-bind="foreach: player.stats">
                    <tr><td><a href="#" data-bind="text: season"></a></td><td><a data-bind="text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}"></a></td><td data-bind="text: age"></td><td data-bind="text: gp"></td><td data-bind="text: gs"></td><td data-bind="round: [min, 1]"></td><td data-bind="round: [fgAtRim, 1]"></td><td data-bind="round: [fgaAtRim, 1]"></td><td data-bind="round: [fgpAtRim, 1]"></td><td data-bind="round: [fgLowPost, 1]"></td><td data-bind="round: [fgaLowPost, 1]"></td><td data-bind="round: [fgpLowPost, 1]"></td><td data-bind="round: [fgMidRange, 1]"></td><td data-bind="round: [fgaMidRange, 1]"></td><td data-bind="round: [fgpMidRange, 1]"></td><td data-bind="round: [tp, 1]"></td><td data-bind="round: [tpa, 1]"></td><td data-bind="round: [tpp, 1]"></td></tr>
                </tbody>
                <tfoot data-bind="with: player.careerStats">
                    <tr><th>Career</th><th></th><th></th><th data-bind="text: gp"></th><th data-bind="text: gs"></th><th data-bind="round: [min, 1]"></th><th data-bind="round: [fgAtRim, 1]"></th><th data-bind="round: [fgaAtRim, 1]"></th><th data-bind="round: [fgpAtRim, 1]"></th><th data-bind="round: [fgLowPost, 1]"></th><th data-bind="round: [fgaLowPost, 1]"></th><th data-bind="round: [fgpLowPost, 1]"></th><th data-bind="round: [fgMidRange, 1]"></th><th data-bind="round: [fgaMidRange, 1]"></th><th data-bind="round: [fgpMidRange, 1]"></th><th data-bind="round: [tp, 1]"></th><th data-bind="round: [tpa, 1]"></th><th data-bind="round: [tpp, 1]"></th></tr>
                </tfoot>
            </table>
        </div>

        <h2>Playoffs</h2>
        <h3>Stats</h3>
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-clickable-rows" id="player_stats">
                <thead>
                    <tr><th colspan="6"></th><th colspan="3" title="Field Goals">FG</th><th colspan="3" title="Three-Pointers">3PT</th><th colspan="3" title="Free Throws">FT</th><th colspan="3" title="Rebounds">Reb</th><th colspan="10"></th></tr>
                    <tr><th>Year</th><th>Team</th><th>Age</th><th title="Games Played">GP</th><th title="Games Started">GS</th><th title="Minutes">Min</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Offensive">Off</th><th title="Defensive">Def</th><th title="Total">Tot</th><th title="Assists">Ast</th><th title="Turnovers">TO</th><th title="Steals">Stl</th><th title="Blocks">Blk</th><th title="Blocks Against">BA</th><th title="Personal Fouls">PF</th><th title="Points">Pts</th><th title="Plus-Minus">+/-</th><th title="Player Efficiency Rating">PER</th><th title="Estimated Wins Added">EWA</th></tr>
                </thead>
                <tbody data-bind="foreach: player.statsPlayoffs">
                    <tr><td><a href="#" data-bind="text: season"></a></td><td><a data-bind="text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}"></a></td><td data-bind="text: age"></td><td data-bind="text: gp"></td><td data-bind="text: gs"></td><td data-bind="round: [min, 1]"></td><td data-bind="round: [fg, 1]"></td><td data-bind="round: [fga, 1]"></td><td data-bind="round: [fgp, 1]"></td><td data-bind="round: [tp, 1]"></td><td data-bind="round: [tpa, 1]"></td><td data-bind="round: [tpp, 1]"></td><td data-bind="round: [ft, 1]"></td><td data-bind="round: [fta, 1]"></td><td data-bind="round: [ftp, 1]"></td><td data-bind="round: [orb, 1]"></td><td data-bind="round: [drb, 1]"></td><td data-bind="round: [trb, 1]"></td><td data-bind="round: [ast, 1]"></td><td data-bind="round: [tov, 1]"></td><td data-bind="round: [stl, 1]"></td><td data-bind="round: [blk, 1]"></td><td data-bind="round: [ba, 1]"></td><td data-bind="round: [pf, 1]"></td><td data-bind="round: [pts, 1]"></td><td data-bind="plusMinus: [pm, 1]"></td><td data-bind="round: [per, 1]"></td><td data-bind="round: [ewa, 1]"></td></tr>
                </tbody>
                <tfoot data-bind="with: player.careerStatsPlayoffs">
                    <tr><th>Career</th><th></th><th></th><th data-bind="text: gp"></th><th data-bind="text: gs"></th><th data-bind="round: [min, 1]"></th><th data-bind="round: [fg, 1]"></th><th data-bind="round: [fga, 1]"></th><th data-bind="round: [fgp, 1]"></th><th data-bind="round: [tp, 1]"></th><th data-bind="round: [tpa, 1]"></th><th data-bind="round: [tpp, 1]"></th><th data-bind="round: [ft, 1]"></th><th data-bind="round: [fta, 1]"></th><th data-bind="round: [ftp, 1]"></th><th data-bind="round: [orb, 1]"></th><th data-bind="round: [drb, 1]"></th><th data-bind="round: [trb, 1]"></th><th data-bind="round: [ast, 1]"></th><th data-bind="round: [tov, 1]"></th><th data-bind="round: [stl, 1]"></th><th data-bind="round: [blk, 1]"></th><th data-bind="round: [ba, 1]"></th><th data-bind="round: [pf, 1]"></th><th data-bind="round: [pts, 1]"></th><th data-bind="plusMinus: [pm, 1]"></th><th data-bind="round: [per, 1]"></th><th data-bind="round: [ewa, 1]"></th></tr>
                </tfoot>
            </table>
        </div>

        <h3>Shot Locations</h3>
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-condensed table-clickable-rows" id="player_stats">
                <thead>
                    <tr><th colspan="6"></th><th colspan="3" title="At Rim">At Rim</th><th colspan="3" title="Low Post">Low Post</th><th colspan="3" title="Mid-Range">Mid-Range</th><th colspan="3" title="Three-Pointers">3PT</th></tr>
                    <tr><th>Year</th><th>Team</th><th>Age</th><th title="Games Played">GP</th><th title="Games Started">GS</th><th title="Minutes">Min</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th><th title="Made">M</th><th title="Attempted">A</th><th title="Percentage">%</th></tr>
                </thead>
                <tbody data-bind="foreach: player.statsPlayoffs">
                    <tr><td><a href="#" data-bind="text: season"></a></td><td><a data-bind="text: abbrev, attrLeagueUrl: {href: ['roster', abbrev, season]}"></a></td><td data-bind="text: age"></td><td data-bind="text: gp"></td><td data-bind="text: gs"></td><td data-bind="round: [min, 1]"></td><td data-bind="round: [fgAtRim, 1]"></td><td data-bind="round: [fgaAtRim, 1]"></td><td data-bind="round: [fgpAtRim, 1]"></td><td data-bind="round: [fgLowPost, 1]"></td><td data-bind="round: [fgaLowPost, 1]"></td><td data-bind="round: [fgpLowPost, 1]"></td><td data-bind="round: [fgMidRange, 1]"></td><td data-bind="round: [fgaMidRange, 1]"></td><td data-bind="round: [fgpMidRange, 1]"></td><td data-bind="round: [tp, 1]"></td><td data-bind="round: [tpa, 1]"></td><td data-bind="round: [tpp, 1]"></td></tr>
                </tbody>
                <tfoot data-bind="with: player.careerStatsPlayoffs">
                    <tr><th>Career</th><th></th><th></th><th data-bind="text: gp"></th><th data-bind="text: gs"></th><th data-bind="round: [min, 1]"></th><th data-bind="round: [fgAtRim, 1]"></th><th data-bind="round: [fgaAtRim, 1]"></th><th data-bind="round: [fgpAtRim, 1]"></th><th data-bind="round: [fgLowPost, 1]"></th><th data-bind="round: [fgaLowPost, 1]"></th><th data-bind="round: [fgpLowPost, 1]"></th><th data-bind="round: [fgMidRange, 1]"></th><th data-bind="round: [fgaMidRange, 1]"></th><th data-bind="round: [fgpMidRange, 1]"></th><th data-bind="round: [tp, 1]"></th><th data-bind="round: [tpa, 1]"></th><th data-bind="round: [tpp, 1]"></th></tr>
                </tfoot>
            </table>
        </div>

        <h2>Ratings</h2>
        <DataTable
            cols={getCols('Year', 'Team', 'Age', 'Pos', 'Ovr', 'Pot', 'rating:Hgt', 'rating:Str', 'rating:Spd', 'rating:Jmp', 'rating:End', 'rating:Ins', 'rating:Dnk', 'rating:FT', 'rating:2Pt', 'rating:3Pt', 'rating:Blk', 'rating:Stl', 'rating:Drb', 'rating:Pss', 'rating:Reb', 'Skills')}
            defaultSort={[0, 'asc']}
            rows={player.ratings.map(r => {
                return {
                    key: r.season,
                    data: [
                        r.season,
                        r.abbrev ? <a href={helpers.leagueUrl(['roster', r.abbrev, r.season])}>{r.abbrev}</a> : null,
                        r.age,
                        r.pos,
                        r.ovr,
                        r.pot,
                        r.hgt,
                        r.stre,
                        r.spd,
                        r.jmp,
                        r.endu,
                        r.ins,
                        r.dnk,
                        r.ft,
                        r.fg,
                        r.tp,
                        r.blk,
                        r.stl,
                        r.drb,
                        r.pss,
                        r.reb,
                        <SkillsBlock className="skills-alone" skills={r.skills} />,
                    ],
                };
            })}
        />

        <div className="row">
            <div className="col-sm-6">
                <h2>Awards</h2>
                <table className="table table-nonfluid table-striped table-bordered table-condensed" id="player-awards" data-bind="visible: player.awardsGrouped().length > 0">
                    <tbody>
                        {player.awardsGrouped.map((a, i) => {
                            return <tr key={i}><td>
                                {a.count > 1 ? <span>{a.count}x </span> : null}
                                {a.type} ({a.seasons.join(', ')})
                            </td></tr>;
                        })}
                    </tbody>
                </table>
                {player.awardsGrouped.length === 0 ? <p>None</p> : null}
            </div>
            <div className="col-sm-6">
                <h2>Statistical Feats</h2>
                {feats.map(e => {
                    return <p key={e.eid}><b>{e.season}</b>: <span dangerouslySetInnerHTML={{__html: e.text}} /></p>;
                })}
                {feats.length === 0 ? <p>None</p> : null}
            </div>
        </div>

        <div className="row">
            <div className="col-md-10 col-md-push-2 col-sm-9 col-sm-push-3">
                <h2>Transactions</h2>
                {events.map(e => {
                    return <p key={e.eid}><b>{e.season}</b>: <span dangerouslySetInnerHTML={{__html: e.text}} /></p>;
                })}
                {events.length === 0 ? <p>None</p> : null}
            </div>
            <div className="col-md-2 col-md-pull-10 col-sm-3 col-sm-pull-9">
                <h2>Salaries</h2>
                <DataTable
                    cols={getCols('Year', 'Amount')}
                    defaultSort={[0, 'asc']}
                    footer={['Total', helpers.formatCurrency([player.salariesTotal, 'M'])]}
                    rows={player.salaries.map(s => {
                        return {
                            key: s.season,
                            data: [s.season, helpers.formatCurrency(s.amount, 'M')],
                        };
                    })}
                />
            </div>
        </div>
    </div>;
};

module.exports = Player;
