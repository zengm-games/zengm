# This converts the JSON files to a CSV file data.csv. Might need tweaking if
# you change the number or format of the input files.

import json

# Any player-season with fewer minutes than this will be discarded
MIN_CUTOFF = 82 * 20

with open('data.csv', 'w') as output_csv:
    col_labels = ['lid', 'pid', 'season', 'per', 'min', 'hgt', 'stre', 'spd',
                  'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'blk', 'stl',
                  'drb', 'pss', 'reb']
    output_csv.write(','.join(col_labels) + '\n')

    for lid in [1, 2, 3, 4, 5]:
        with open('BBGM - League ' + str(lid) + '.json') as json_data:
            d = json.load(json_data)

        # Loop over every season the player has a ratings entry for
        for p in d['players']:
            for r in p['ratings']:
                season = r['season']

                # Find the stats for that season, and save if appropriate
                for s in p['stats']:
                    if s['season'] == season and s['min'] > MIN_CUTOFF:
                        row = [lid, p['pid'], season, s['per'], s['min'],
                               r['hgt'], r['stre'], r['spd'], r['jmp'],
                               r['endu'], r['ins'], r['dnk'], r['ft'], r['fg'],
                               r['tp'], r['blk'], r['stl'], r['drb'], r['pss'],
                               r['reb']]
                        output_csv.write(','.join(map(str, row)) + '\n')