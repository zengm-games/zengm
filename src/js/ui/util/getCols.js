// @flow

/* eslint quote-props: "off" */

import {helpers} from '../../common';
import type {SortOrder, SortType} from '../../common/types';

const cols: {
    [key: string]: {
        desc?: string,
        sortSequence?: SortOrder[],
        sortType?: SortType,
        title?: string, // Should actually be required, but is only added later
    }
} = {
    '': {
        sortSequence: ['desc', 'asc'],
    },
    '#': {},
    '%': {
        desc: 'Percentage',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    '+/-': {
        desc: 'Plus/Minus',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'A': {
        desc: 'Attempted',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'ADT': {
        desc: 'All Defensive Team',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'ALT': {
        desc: 'All League Team',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'ART': {
        desc: 'All Rookie Team',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Age': {
        sortType: 'number',
    },
    'Amount': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Asking For': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
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
    'BR': {
        desc: 'Best Record',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'BRC': {
        desc: 'Best Conference Record',
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
    'Championships': {
        desc: 'Championships Won',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Conference': {},
    'Contract': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Count': {
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Country': {},
    'Current Contract': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'DPOY': {
        desc: 'Defensive Player of the Year',
        sortType: 'name',
    },
    'Def': {
        desc: 'Defensive',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Desired Contract': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Diff': {
        desc: 'Point Differential',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Division': {},
    'Draft': {
        sortSequence: [],
    },
    'Drafted': {},
    'EWA': {
        desc: 'Estimated Wins Added',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'FG%': {
        desc: 'Field Goal Percentage',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'FT%': {
        desc: 'Free Throw Percentage',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Finals': {
        desc: 'Finals Appearances',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Finals MVP': {
        desc: 'Finals Most Valuable Player',
        sortType: 'name',
    },
    'GP': {
        desc: 'Games Played',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'GS': {
        desc: 'Games Started',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'GmSc': {
        desc: 'Game Score',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'HOF': {
        sortSequence: ['desc', 'asc'],
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
    'Last': {
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Last Playoffs': {
        sortType: 'number',
    },
    'Last Season': {
        desc: 'Last Season with Team',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Last Title': {
        sortType: 'number',
    },
    'League Champion': {},
    'M': {
        desc: 'Made',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'MVP': {
        desc: 'Most Valuable Player',
        sortType: 'name',
    },
    'Min': {
        desc: 'Minutes Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Mood': {},
    'Name': {
        sortType: 'name',
    },
    'Negotiate': {},
    'O': {
        desc: 'Overall',
    },
    'OPts': {
        desc: "Opponent's Points",
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Opp': {
        desc: 'Opponent',
    },
    'Off': {
        desc: 'Offensive',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Ovr': {
        desc: 'Overall Rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
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
    'Playoffs': {
        desc: 'Playoff Appearances',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Pos': {
        desc: 'Position',
    },
    'Pot': {
        desc: 'Potential Rating',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
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
    'ROY': {
        desc: 'Rookie of the Year',
        sortType: 'name',
    },
    'Reb': {
        desc: 'Rebounds Per Game',
        sortSequence: ['desc', 'asc'],
        sortType: 'number',
    },
    'Result': {},
    'Retired': {
        sortSequence: ['desc', 'asc'],
    },
    'Revenue (YTD)': {
        sortSequence: ['desc', 'asc'],
        sortType: 'currency',
    },
    'Runner Up': {},
    'SMOY': {
        desc: 'Sixth Man of the Year',
        sortType: 'name',
    },
    'Season': {
        sortSequence: ['desc', 'asc'],
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
    'TP%': {
        desc: 'Three Point Percentage',
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

for (const key of Object.keys(cols)) {
    cols[key].title = key.replace('rating:', '');
}

export default (...titles: string[]) => {
    return titles.map((title) => {
        if (!cols.hasOwnProperty(title)) {
            throw new Error(`Unknown column: "${title}"`);
        }

        // Deep copy so other properties can be set on col, like width
        return helpers.deepCopy(cols[title]);
    });
};
