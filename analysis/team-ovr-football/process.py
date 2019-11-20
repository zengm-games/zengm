import glob
import json
import matplotlib.pyplot as plt  
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

def get_cols():
    cols = {
        "ovrQB": [],
        "ovr0": [],
        "ovr1": [],
        "ovr2": [],
        "ovr3": [],
        "ovr4": [],
        "ovr5": [],
        "ovr6": [],
        "ovr7": [],
        "ovr8": [],
        "ovr9": [],
        "ovr10": [],
        "ovr11": [],
        "ovr12": [],
        "ovr13": [],
        "ovr14": [],
        "ovr15": [],
        "ovr16": [],
        "ovr17": [],
        "ovr18": [],
        "ovr19": [],
        "mov": [],
    }

    files = glob.glob('data*.json')
    files.sort()
    print(files)

    for file in files:
        with open(file, "r", encoding='utf-8-sig') as read_file:
            data = json.load(read_file)

        def get_ovrs(tid, season):
            ovrs = []
            ovr_qb = 0

            for p in data['players']:
                if tid in p['statsTids']:
                    for ps in p['stats']:
                        if ps['season'] == season and ps['tid'] == tid:
                            # Can use this to identify QB only because there are no trades/deaths/injuries
                            qb_games = ps['qbW'] + ps['qbL'] + ps['qbT']

                            found_ratings = False
                            for pr in p['ratings']:
                                if pr['season'] == season:
                                    found_ratings = True
                                    if qb_games > 0:
                                        if ovr_qb > 0:
                                            raise Exception("Multiple QBs found")
                                        ovr_qb = pr['ovrs']['QB']
                                    else:
                                        ovrs.append(pr['ovr'])
                                    break
                            if not found_ratings:
                                raise Exception("No ratings found")
                            break
                        elif ps['season'] > season:
                            break

            if ovr_qb == 0:
                raise Exception("No QB found")

            ovrs.sort(reverse=True)

            return [ovr_qb, ovrs]

        for t in data['teams']:
            tid = t['tid']
            for ts in t['stats']:
                if not ts['playoffs'] and ts['gp'] > 0:
                    season = ts['season']
                    mov = (ts['pts'] - ts['oppPts']) / ts['gp'];
                    cols['mov'].append(mov)

                    [ovr_qb, ovrs] = get_ovrs(tid, season)
                    cols['ovrQB'].append(ovr_qb)
                    cols['ovr0'].append(ovrs[0])
                    cols['ovr1'].append(ovrs[1])
                    cols['ovr2'].append(ovrs[2])
                    cols['ovr3'].append(ovrs[3])
                    cols['ovr4'].append(ovrs[4])
                    cols['ovr5'].append(ovrs[5])
                    cols['ovr6'].append(ovrs[6])
                    cols['ovr7'].append(ovrs[7])
                    cols['ovr8'].append(ovrs[8])
                    cols['ovr9'].append(ovrs[9])
                    cols['ovr10'].append(ovrs[10])
                    cols['ovr11'].append(ovrs[11])
                    cols['ovr12'].append(ovrs[12])
                    cols['ovr13'].append(ovrs[13])
                    cols['ovr14'].append(ovrs[14])
                    cols['ovr15'].append(ovrs[15])
                    cols['ovr16'].append(ovrs[16])
                    cols['ovr17'].append(ovrs[17])
                    cols['ovr18'].append(ovrs[18])
                    cols['ovr19'].append(ovrs[19])

    return cols

cols = get_cols()

dataset = pd.DataFrame(cols)

reg = LinearRegression(normalize=True)
fit_cols = ['ovrQB', 'ovr0', 'ovr1', 'ovr2', 'ovr3', 'ovr4', 'ovr5', 'ovr6', 'ovr7', 'ovr8', 'ovr9', 'ovr10', 'ovr11', 'ovr12', 'ovr13', 'ovr14', 'ovr15', 'ovr16', 'ovr17', 'ovr18', 'ovr19']
reg.fit(dataset[fit_cols], dataset['mov'])
dataset['mov_predicted'] = reg.predict(dataset[fit_cols])

print('Intercept: \n', reg.intercept_)
print('Coefficients: \n', reg.coef_)
print('r2: ', r2_score(dataset['mov'], dataset['mov_predicted']))

print(dataset)


# dataset.plot.hexbin(x='mov', y='mov_predicted', gridsize=20)
dataset.plot.scatter(x='mov', y='mov_predicted', alpha=0.2)
plt.xlabel('Actual MOV')  
plt.ylabel('Predicted MOV')  

plt.plot([-20, 20], [-20, 20])

plt.show()
