import pandas as pd  
import numpy as np  
import matplotlib.pyplot as plt  
from sklearn.linear_model import LinearRegression
from collections import defaultdict

y_map = { 'hgt': 'hgt',
   'stre': 'str',
   'spd': 'spd',
   'jmp': 'jmp',
   'endu': 'end',
   'ins': 'ins',
   'dnk': 'dnk',
   'ft': 'ft.1',
   'fg': '2pt',
   'tp': '3pt',
   'diq': 'diq',
   'oiq': 'oiq',
   'drb': 'drb',
   'pss': 'pss',
   'reb': 'reb' }


game = pd.read_csv('game.csv')
avg = pd.read_csv('avg.csv')

# save homecourt
hm_crt2 = defaultdict(list)
for g in game.itertuples():
    hm_crt2[g[1]].append(g[5])
hm_crt = {k:[v[0],v[-1]] for k,v in hm_crt2.items()}

# add keys for merge
avg['fakeKey'] = avg['pid'].astype(str) + '_' + avg['Season'].astype(str)
game['fakeKey'] = game['pid'].astype(str) + '_' + game['Season'].astype(str)

# merge
game_rate = game.merge(avg,on='fakeKey')

# make minute-averaged ratings
team_rating = defaultdict(lambda:np.zeros(17))
team_score = {}
team_minutes =defaultdict(float)

real_gids = defaultdict(set)

for row in game_rate.itertuples():
    key = (row[1],row[5])
    if row[5] == row[6]:
        continue
    MP = row[11]
    rt = MP *np.array(row[92:])
    ms,os = [int(_) for _ in row[7].split('-')]

    team_rating[key] += rt
    team_minutes[key] += MP
    team_score[key] = ms-os
    
    real_gids[key[0]].add(key[1])

team_rating_n = {k: team_rating[k]/team_minutes[k] for k in team_rating}
team_rating_ovr = {k: v[0] for k,v in team_rating_n.items()}

game_res = []
gt = []
for gid,teams in hm_crt.items():
    t = list(teams)
    game_res.append( list(team_rating_n[(gid,t[0])] - team_rating_n[(gid,t[1])]) + [team_score[(gid,t[0])]] )
    gt.append(gid)

ratings_regression = list(game_rate.columns[91:])
diff_df = pd.DataFrame(np.array(game_res),columns=ratings_regression + ['MOV'])

# CRAP! normalize doesn't actually do zscore, so some of the stuff below is wrong! Might not matter much
reg = LinearRegression()
rating_vals = list(diff_df.drop(['MOV','Ovr','Pot'],axis=1).columns)
reg.fit(diff_df[rating_vals], diff_df['MOV'])
# print('Intercept: \n', reg.intercept_)
# print('Coefficients: \n', reg.coef_)

# Adjust old ovrs for the ratings we're skipping
# Recompute Ovr because we want the unscaled version, so scaling can be applied on top in JS

# Adjust old ovrs for the ratings we're skipping
# Recompute Ovr because we want the unscaled version, so scaling can be applied on top in JS
avg['OvrOld'] = (5 * avg['Hgt'] + 1 * avg['Str'] + 4 * avg['Spd'] + 2 * avg['Jmp'] + 1 * avg['End'] + 1 * avg['Ins'] + 2 * avg['Dnk'] + 1 * avg['FT.1'] + 1 * avg['2Pt'] + 3 * avg['3Pt'] + 7 * avg['oIQ'] + 3 * avg['dIQ'] + 3 * avg['Drb'] + 3 * avg['Pss'] + 1 * avg['Reb']) / 38

# Scale to match old ovr
mean_old = avg.OvrOld.mean()
std_old = avg.OvrOld.std()

ovr_new_unscaled = reg.predict(avg[rating_vals])
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
ratings = [_.lower() for _ in rating_vals]
ratings2 = ['hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'tp', 'oiq', 'diq', 'drb', 'pss', 'fg', 'reb'];
for i in range(len(ratings2)):
    if i == len(ratings2) - 1:
        end_part = ''
    else:
        end_part = ' +'
    idx = ratings.index(y_map[ratings2[i]])
    print('    ' + formatThree(factor_mult * reg.coef_[idx]) + ' * ratings.' + ratings2[i] + end_part)
print(') + ' + formatThree(factor_add));


# Plot
avg.plot.hexbin(x='OvrOld', y='OvrNew', gridsize=20)
plt.xlim(0, 100)
plt.ylim(0, 100)
plt.xlabel('Old Ovr')  
plt.ylabel('New Ovr')  

plt.plot([0, 100], [0, 100])

plt.show()