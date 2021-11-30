import json
import pandas as pd  
import numpy as np  
import matplotlib.pyplot as plt  
from sklearn.linear_model import LinearRegression
from collections import defaultdict

files = ['random-players-3.json']

ratings = ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "oiq", "diq", "drb", "pss", "reb"]
ratings_regression = ["hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "tp", "oiq", "diq", "drb", "pss"]
ratings_skip = ["fg", "reb"]
factor_skip = 0.01

ratings_raw = []
games_raw = []

for file in files:
    with open(file, "r", encoding='utf-8-sig') as read_file:
        print("loading " + file)
        data = json.load(read_file)
        print("parsing " + file)
        for p in data["players"]:
            for ratings_row in p["ratings"]:
                key = json.dumps([file, p["pid"], ratings_row["season"]])
                ratings_raw_row = {
                    "key": key,
                    "pid": p["pid"],
                }
                for rating in ratings:
                    ratings_raw_row[rating] = ratings_row[rating]
                ratings_raw.append(ratings_raw_row)

        for g in data["games"]:
            mov = g["teams"][0]["pts"] - g["teams"][1]["pts"]
            for i in range(len(g["teams"])):
                t = g["teams"][i]
                t2 = g["teams"][0 if i == 1 else 1]
                for p in t["players"]:
                    key = json.dumps([file, p["pid"], g["season"]])
                    games_row_raw = {
                        "key": key,
                        "gid": g["gid"],
                        "pid": p["pid"],
                        "mov": mov,
                        "min": p["min"],
                        "tid": t["tid"],
                        "tid2": t2["tid"],
                        "home": i == 0,
                    }
                    games_raw.append(games_row_raw)

avg = pd.DataFrame(ratings_raw)
game = pd.DataFrame(games_raw)
print(avg)
print(game)

# merge
game_rate = game.merge(avg,on='key')

# make minute-averaged ratings
team_rating = defaultdict(lambda:np.zeros(len(ratings_regression)))
team_score = {}
team_minutes =defaultdict(float)
game_indexes = []

# https://stackoverflow.com/questions/44634972/how-to-access-a-field-of-a-namedtuple-using-a-variable-for-the-field-name
idx = {name: i for i, name in enumerate(list(game_rate), start=1)}
for row in game_rate.itertuples():
    key = (row.gid,row.tid)
    if row.home:
        game_indexes.append((row.gid, row.tid, row.tid2))
        team_score[key] = row.mov
    MP = row.min
    rt = MP *np.array([row[idx[key]] for key in ratings_regression])

    team_rating[key] += rt
    team_minutes[key] += MP

team_rating_n = {k: team_rating[k]/team_minutes[k] for k in team_rating}

game_res = []
gt = []
for gid,tid,tid2 in game_indexes:
    game_res.append( list(team_rating_n[(gid,tid)] - team_rating_n[(gid,tid2)]) + [team_score[(gid,tid)]] )
    gt.append(gid)

diff_df = pd.DataFrame(np.array(game_res),columns=ratings_regression + ['mov'])

reg = LinearRegression()
reg.fit(diff_df[ratings_regression], diff_df['mov'])
# print('Intercept: \n', reg.intercept_)
# print('Coefficients: \n', reg.coef_)

# Adjust old ovrs for the ratings we're skipping
# Recompute Ovr because we want the unscaled version, so scaling can be applied on top in JS

# Adjust old ovrs for the ratings we're skipping
# Recompute Ovr because we want the unscaled version, so scaling can be applied on top in JS
avg['OvrOld'] = (5 * avg['hgt'] + 1 * avg['stre'] + 4 * avg['spd'] + 2 * avg['jmp'] + 1 * avg['endu'] + 1 * avg['ins'] + 2 * avg['dnk'] + 1 * avg['ft'] + 1 * avg['fg'] + 3 * avg['tp'] + 7 * avg['oiq'] + 3 * avg['diq'] + 3 * avg['drb'] + 3 * avg['pss'] + 1 * avg['reb']) / 38
for rating in ratings_skip:
    avg.OvrOld = avg.OvrOld - factor_skip * (avg[rating] - avg[rating].mean())

# Scale to match old ovr
mean_old = avg.OvrOld.mean()
std_old = avg.OvrOld.std()


ovr_new_unscaled = reg.predict(avg[ratings_regression])
mean_new = ovr_new_unscaled.mean()
std_new = ovr_new_unscaled.std()

factor_mult = std_old / std_new
factor_add = mean_old
# print('factor_mult: \n', factor_mult)
# print('factor_add: \n', factor_add)

avg['OvrNew'] = (ovr_new_unscaled-mean_new) * factor_mult + factor_add
# print(dataset.Ovr)
# print(dataset.OvrNew)

def formatThree(num):
    return str(np.format_float_positional(num, precision=3, unique=False, fractional=False, trim='k'))

print(avg[['OvrOld', 'OvrNew']])

# Output
print('(')
for i in range(len(ratings)):
    end_part =  ' - ' + formatThree(avg[ratings[i]].mean()) + ')'
    if i == len(ratings) - 1:
        end_part += ''
    else:
        end_part += ' +'

    rating = ratings[i]
    if rating in ratings_regression:
        idx = ratings_regression.index(ratings[i])
        print('    ' + formatThree(factor_mult * reg.coef_[idx]) + ' * (ratings.' + ratings[i] + end_part)
    else:
        print('    ' + formatThree(factor_skip) + ' * (ratings.' + ratings[i] + end_part)
print(') + ' + formatThree(factor_add))


# Plot
avg.plot.hexbin(x='OvrOld', y='OvrNew', gridsize=20)
plt.xlim(0, 100)
plt.ylim(0, 100)
plt.xlabel('Old Ovr')  
plt.ylabel('New Ovr')  

plt.plot([0, 100], [0, 100])

plt.show()
