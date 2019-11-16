import json
import matplotlib.pyplot as plt  
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score

def get_cols():
    cols = {
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
        "mov": [],
    }

    with open("data.json", "r", encoding='utf-8-sig') as read_file:
        data = json.load(read_file)

    def get_ovrs(tid, season):
        ovrs = []

        for p in data['players']:
            if tid in p['statsTids']:
                for ps in p['stats']:
                    if ps['season'] == season and ps['tid'] == tid:
                        found_ratings = False
                        for pr in p['ratings']:
                            if pr['season'] == season:
                                found_ratings = True
                                ovrs.append(pr['ovr'])
                                break
                        if not found_ratings:
                            raise Exception("No ratings found")
                        break
                    elif ps['season'] > season:
                        break

        ovrs.sort(reverse=True)

        return ovrs

    for t in data['teams']:
        tid = t['tid']
        for ts in t['stats']:
            if not ts['playoffs'] and ts['gp'] > 0:
                season = ts['season']
                mov = (ts['pts'] - ts['oppPts']) / ts['gp'];
                cols['mov'].append(mov)

                ovrs = get_ovrs(tid, season)
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

    return cols

cols = get_cols()

dataset = pd.DataFrame(cols)

reg = LinearRegression(normalize=True)
fit_cols = ['ovr0', 'ovr1', 'ovr2', 'ovr3', 'ovr4', 'ovr5', 'ovr6', 'ovr7', 'ovr8', 'ovr9']
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
