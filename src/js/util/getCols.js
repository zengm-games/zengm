const helpers = require('./helpers');

const cols = {
    '#': {},
    '%': {
        desc: 'Percentage',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'A': {
        desc: 'Attempted',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Age': {},
    'Ast': {
        desc: 'Assists Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Avg Attendance': {
        sortSequence: ['desc', 'asc'],
    },
    'BA': {
        desc: 'Blocks Against',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Blk': {
        desc: 'Blocks',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Cash': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Country': {},
    'Def': {
        desc: 'Defensive',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Diff': {
        desc: 'Point Differential',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Drafted': {},
    'EWA': {
        desc: 'Estimated Wins Added',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'GP': {
        desc: 'Games Played',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'L': {
        desc: 'Games Lost',
        sortSequence: ['desc', 'asc'],
    },
    'L10': {
        desc: 'Last Ten Games',
        sortSequence: ['desc', 'asc'],
        sortType: 'lastTen',
    },
    'M': {
        desc: 'Made',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Min': {
        desc: 'Minutes Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Name': {
        sortType: 'name',
    },
    'O': {
        desc: 'Overall',
    },
    'OPts': {
        desc: "Opponent's Points",
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Off': {
        desc: 'Offensive',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Ovr': {
        desc: 'Overall Rating',
        sortSequence: ['desc', 'asc'],
    },
    'P': {
        desc: 'Performance',
    },
    'PER': {
        desc: 'Player Efficiency Rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'PF': {
        desc: 'Personal Fouls',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'PPG': {
        desc: 'Points Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Payroll': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Peak Ovr': {
        desc: 'Peak Overall Rating',
        sortSequence: ['desc', 'asc'],
    },
    'Pick': {
        desc: 'Draft Pick',
        sortType: 'draftPick',
    },
    'Pos': {
        desc: 'Position',
    },
    'Pot': {
        desc: 'Potential Rating',
        sortSequence: ['desc', 'asc'],
    },
    'Profit (YTD)': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Pts': {
        desc: 'Points',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Reb': {
        desc: 'Rebounds Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Retired': {},
    'Revenue (YTD)': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Skills': {},
    'Stl': {
        desc: 'Steals',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'T': {
        desc: 'Talent',
    },
    'TO': {
        desc: 'Turnovers',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Team': {},
    'Tot': {
        desc: 'Total',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'W': {
        desc: 'Games Won',
        sortSequence: ['desc', 'asc'],
    },
    'Year': {},

    // "rating:" prefix is to prevent collisions with stats
    'rating:2Pt': {
        desc: 'Two-Point Shooting',
        sortSequence: ['desc', 'asc'],
    },
    'rating:3Pt': {
        desc: 'Three-Point Shooting',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Blk': {
        desc: 'Blocks',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Dnk': {
        desc: 'Dunks/Layups',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Drb': {
        desc: 'Dribbling',
        sortSequence: ['desc', 'asc'],
    },
    'rating:End': {
        desc: 'Endurance',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Hgt': {
        desc: 'Height',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Ins': {
        desc: 'Inside Scoring',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Jmp': {
        desc: 'Jumping',
        sortSequence: ['desc', 'asc'],
    },
    'rating:FT': {
        desc: 'Free Throw Shooting',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Pss': {
        desc: 'Passing',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Reb': {
        desc: 'Rebounding',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Spd': {
        desc: 'Speed',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Stl': {
        desc: 'Steals',
        sortSequence: ['desc', 'asc'],
    },
    'rating:Str': {
        desc: 'Strength',
        sortSequence: ['desc', 'asc'],
    },
};



for (const key in cols) {
    if (cols.hasOwnProperty(key)) {
        cols[key].title = key.replace('rating:', '');
    }
}

module.exports = (...titles) => {
    return titles.map(title => {
        if (!cols.hasOwnProperty(title)) {
            throw new Error(`Unknown column: "${title}"`);
        }

        return helpers.deepCopy(cols[title]);
    });
};
