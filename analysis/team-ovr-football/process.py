import glob
import json
import matplotlib.pyplot as plt  
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

def get_cols():
    cols = {
        'QB': [],
        'RB1': [],
        'RB2': [],
        'TE1': [],
        'TE2': [],
        'WR1': [],
        'WR2': [],
        'WR3': [],
        'WR4': [],
        'WR5': [],
        'OL1': [],
        'OL2': [],
        'OL3': [],
        'OL4': [],
        'OL5': [],
        'CB1': [],
        'CB2': [],
        'CB3': [],
        'S1': [],
        'S2': [],
        'S3': [],
        'LB1': [],
        'LB2': [],
        'LB3': [],
        'LB4': [],
        'DL1': [],
        'DL2': [],
        'DL3': [],
        'DL4': [],
        'K': [],
        'P': [],
        "mov": [],
    }

    files = glob.glob('data*.json')
    files.sort()
    print(files)

    for file in files:
        with open(file, "r", encoding='utf-8-sig') as read_file:
            data = json.load(read_file)

        def get_ovrs(tid, season):
            ovrs_by_pos = {
                'QB': [],
                'RB': [],
                'TE': [],
                'WR': [],
                'OL': [],
                'CB': [],
                'S': [],
                'LB': [],
                'DL': [],
                'K': [],
                'P': [],
            }

            for p in data['players']:
                if tid in p['statsTids']:
                    for ps in p['stats']:
                        if ps['season'] == season and ps['tid'] == tid:
                            found_ratings = False
                            for pr in p['ratings']:
                                if pr['season'] == season:
                                    found_ratings = True
                                    ovrs_by_pos[pr['pos']].append(pr['ovr'])
                                    break
                            if not found_ratings:
                                raise Exception("No ratings found")
                            break
                        elif ps['season'] > season:
                            break

            for key in ovrs_by_pos.keys():
                ovrs_by_pos[key].sort(reverse=True)

            return ovrs_by_pos

        for t in data['teams']:
            tid = t['tid']
            for ts in t['stats']:
                if not ts['playoffs'] and ts['gp'] > 0:
                    season = ts['season']
                    mov = (ts['pts'] - ts['oppPts']) / ts['gp'];
                    cols['mov'].append(mov)

                    ovrs = get_ovrs(tid, season)

                    default_ovr = 20

                    cols['QB'].append(ovrs['QB'][0] if len(ovrs['QB']) >= 1 else default_ovr)
                    cols['RB1'].append(ovrs['RB'][0] if len(ovrs['RB']) >= 1 else default_ovr)
                    cols['RB2'].append(ovrs['RB'][1] if len(ovrs['RB']) >= 2 else default_ovr)
                    cols['TE1'].append(ovrs['TE'][0] if len(ovrs['TE']) >= 1 else default_ovr)
                    cols['TE2'].append(ovrs['TE'][1] if len(ovrs['TE']) >= 2 else default_ovr)
                    cols['WR1'].append(ovrs['WR'][0] if len(ovrs['WR']) >= 1 else default_ovr)
                    cols['WR2'].append(ovrs['WR'][1] if len(ovrs['WR']) >= 2 else default_ovr)
                    cols['WR3'].append(ovrs['WR'][2] if len(ovrs['WR']) >= 3 else default_ovr)
                    cols['WR4'].append(ovrs['WR'][3] if len(ovrs['WR']) >= 4 else default_ovr)
                    cols['WR5'].append(ovrs['WR'][4] if len(ovrs['WR']) >= 5 else default_ovr)
                    cols['OL1'].append(ovrs['OL'][0] if len(ovrs['OL']) >= 1 else default_ovr)
                    cols['OL2'].append(ovrs['OL'][1] if len(ovrs['OL']) >= 2 else default_ovr)
                    cols['OL3'].append(ovrs['OL'][2] if len(ovrs['OL']) >= 3 else default_ovr)
                    cols['OL4'].append(ovrs['OL'][3] if len(ovrs['OL']) >= 4 else default_ovr)
                    cols['OL5'].append(ovrs['OL'][4] if len(ovrs['OL']) >= 5 else default_ovr)
                    cols['CB1'].append(ovrs['CB'][0] if len(ovrs['CB']) >= 1 else default_ovr)
                    cols['CB2'].append(ovrs['CB'][1] if len(ovrs['CB']) >= 2 else default_ovr)
                    cols['CB3'].append(ovrs['CB'][2] if len(ovrs['CB']) >= 3 else default_ovr)
                    cols['S1'].append(ovrs['S'][0] if len(ovrs['S']) >= 1 else default_ovr)
                    cols['S2'].append(ovrs['S'][1] if len(ovrs['S']) >= 2 else default_ovr)
                    cols['S3'].append(ovrs['S'][2] if len(ovrs['S']) >= 3 else default_ovr)
                    cols['LB1'].append(ovrs['LB'][0] if len(ovrs['LB']) >= 1 else default_ovr)
                    cols['LB2'].append(ovrs['LB'][1] if len(ovrs['LB']) >= 2 else default_ovr)
                    cols['LB3'].append(ovrs['LB'][2] if len(ovrs['LB']) >= 3 else default_ovr)
                    cols['LB4'].append(ovrs['LB'][3] if len(ovrs['LB']) >= 4 else default_ovr)
                    cols['DL1'].append(ovrs['DL'][0] if len(ovrs['DL']) >= 1 else default_ovr)
                    cols['DL2'].append(ovrs['DL'][1] if len(ovrs['DL']) >= 2 else default_ovr)
                    cols['DL3'].append(ovrs['DL'][2] if len(ovrs['DL']) >= 3 else default_ovr)
                    cols['DL4'].append(ovrs['DL'][3] if len(ovrs['DL']) >= 4 else default_ovr)
                    cols['K'].append(ovrs['K'][0] if len(ovrs['K']) >= 1 else default_ovr)
                    cols['P'].append(ovrs['P'][0] if len(ovrs['P']) >= 1 else default_ovr)

    return cols

cols = get_cols()

dataset = pd.DataFrame(cols)

reg = LinearRegression(normalize=True)
fit_cols = ['QB', 'RB1', 'RB2', 'TE1', 'TE2', 'WR1', 'WR2', 'WR3', 'WR4', 'WR5', 'OL1', 'OL2', 'OL3', 'OL4', 'OL5', 'CB1', 'CB2', 'CB3', 'S1', 'S2', 'S3', 'LB1', 'LB2', 'LB3', 'LB4', 'DL1', 'DL2', 'DL3', 'DL4', 'K', 'P']
reg.fit(dataset[fit_cols], dataset['mov'])
dataset['mov_predicted'] = reg.predict(dataset[fit_cols])

print('Intercept: \n', reg.intercept_)
print('Coefficients: \n', reg.coef_)
print('r2: ', r2_score(dataset['mov'], dataset['mov_predicted']))

print(dataset)


dataset.plot.hexbin(x='mov', y='mov_predicted', gridsize=20)
# dataset.plot.scatter(x='mov', y='mov_predicted', alpha=0.2)
plt.xlabel('Actual MOV')  
plt.ylabel('Predicted MOV')  

plt.plot([-20, 20], [-20, 20])

plt.show()
