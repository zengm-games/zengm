import pandas as pd  
import numpy as np  
import matplotlib.pyplot as plt  
from sklearn.linear_model import LinearRegression,Ridge,ElasticNet,ElasticNetCV,LassoCV,SGDRegressor,RidgeCV
from collections import defaultdict
import json
import statsmodels.api as sm

from sklearn.preprocessing import StandardScaler, PolynomialFeatures
import os, sys

import fnmatch



Xso = []
y = []

pos_Xs = defaultdict(list)
pos_y = defaultdict(list) 
pos_min = defaultdict(list) 

for file in sorted(os.listdir('.')):
    if fnmatch.fnmatch(file, 'FBGM_League*.json'):
        print(file)
        data = json.load(open(file,'rt',encoding='utf-8-sig'))
        player_ratings = {}
        player_pos = {}

        valid_pos = set()
        for p in data['players']:
            for r in p['ratings']:
                player_ratings[(p['pid'],r['season'])] ={k:v for k,v in r.items() if type(v) == int and k != 'season'}
                player_pos[(p['pid'],r['season'])] =r['pos']

                valid_pos.add(r['pos'])
        for p in data['players']:
            for r in p['stats']:
                if r['min'] > 0:
                    pos = player_pos[(p['pid'],r['season'])]
                    pAV = r['av']
                    if pAV:
                        pos_Xs[pos].append(player_ratings[(p['pid'],r['season'])])
                        pos_y[pos].append(float(pAV)/r['min'])
                        pos_min[pos].append(r['min'])

        valid_pos = sorted(list(valid_pos))
        valid_col = [k for k in list(player_ratings.values())[0] if k not in ['min','pos','ovr','pot','injuryIndex']]
        print(valid_pos)

        for g in data['games']:
            season = g['season']
            if g['won']['tid'] == g['teams'][0]['tid']: #home team won
                s = g['won']['pts'] - g['lost']['pts'] 
            else:
                s =  g['lost']['pts'] - g['won']['pts']
            y.append(s)
            r2 = []
            for i in range(2):
                team_r = []
                t = g['teams'][i]['players']
                for p in t:
                    pos = p['pos']
                    mp = p['min']
                    r = {k:mp*v for k,v in player_ratings[(p['pid'],season)].items()}
                    r['pos'] = pos
                    r['min'] = mp
                    if mp > 0:
                        team_r.append(r)
                # dummies to make sure we have players at every pos
                for p in valid_pos:
                    r = {k:0 for k in r}
                    r['pos'] = p
                    r['min'] = 1e-9
                    team_r.append(r)

                # should be alphabetical
                res = pd.DataFrame(team_r).groupby('pos').sum()
                res2 = res.divide(res['min'],'rows')
                ra = np.array(res2[valid_col])
                r2.append(ra)
            Xso.append(np.array(r2[0] - r2[1]).flatten())



for pos in valid_pos:
    print(pos)
    #Xs = np.nan_to_num(pos_Xs[pos],0)
    fx = StandardScaler()
    y2 = np.array(pos_y[pos]).astype(float)
    X3 = sm.add_constant(pd.DataFrame(fx.fit_transform(pd.DataFrame(pos_Xs[pos])[valid_col]),columns=valid_col))
    est = sm.OLS(y2, X3)
    est2 = est.fit()
    print(est2.summary())



#X3.shape,y.shape



len(Xso),len(y)



plt.hist(y,20)



Xs = np.nan_to_num(Xso,0)
fx = StandardScaler()
X2 = Xs#fx.fit_transform(Xs)
y = np.array(y).astype(float)

reg = ElasticNetCV([.1,.7,.725,.75,.775,.8,.9,.95,.99,1],cv=10,positive=True,max_iter=1e4)#(alpha=0.1,l1_ratio=0.7)#CV(cv=10)#ElasticNetCV(.7,cv=10,)
#reg = lgb.LGBMRegressor()
reg.fit(X2,y)
print(Xs.shape,reg.score(X2,y))



plt.style.use('seaborn-white')
plt.scatter(reg.predict(X2),y,s=10,alpha=0.5)
plt.ylim(-60,60)
plt.xlim(-60,60)
plt.xlabel('predicted margin')
plt.ylabel('actual margin')



#sorted([(i,n) for i,n in zip(reg.feature_importances_,exp_lbl) if 'LB' in n],reverse=True)



reg.l1_ratio_



exp_lbl = sum([[str(p) + '_' + str(s) for s in valid_col] for p in valid_pos],[])



X3 = sm.add_constant(pd.DataFrame(X2,columns=exp_lbl))
est = sm.OLS(y, X3)
est2 = est.fit()
print(est2.summary())



print('home field adv is {:.1f} points'.format(reg.intercept_))



future_use = defaultdict(dict)
ratings_per_pos = reg.coef_.reshape((len(valid_pos),-1))
df_rate = pd.DataFrame(ratings_per_pos,index=valid_pos,columns=valid_col)
for row in df_rate.iterrows():
    res = sorted([(abs(v),k) for k,v in row[1].items()],reverse=True)
    print(row[0]+' : { ')
    for i in range(len(res)):
        if np.linalg.norm(row[1][res[i][1]]) > 0:
            future_use[row[0]][res[i][1]] = row[1][res[i][1]]
            print('\t{}: [{:.3f}, 1],'.format(res[i][1],row[1][res[i][1]]))
    print('},')



ratings_to_use = [k for k,v in (est2.pvalues < 0.1).items() if v if k != 'const']
reg_small = ElasticNetCV(positive=True,cv=10)
reg_small.fit(Xs[:,[list(exp_lbl).index(r) for r in ratings_to_use]],y)



res = sorted([(abs(v),k) for k,v in zip(ratings_to_use,reg_small.coef_) if 'WR' in k],reverse=True)
for v,k in res:
    print('{}\t{}\t{:.3f}'.format('',k,v))
print()






rts = defaultdict(list)
for file in sorted(os.listdir('.')):
    if fnmatch.fnmatch(file, 'FBGM_League*.json'):
        print(file)
        data = json.load(open(file,'rt',encoding='utf-8-sig'))


        valid_pos = set()
        for p in data['players']:
            for r in p['ratings']:
                r2 = sum([future_use[r['pos']][k]*v for k,v in r.items() if type(v) == int and k != 'season' and k in future_use[r['pos']]])
                rts[r['pos']].append((r['ovr'],r2))



i=1
for pos, results in rts.items():
    print(pos)
    plt.subplot(3,4,i)
    plt.title(pos)
    A = np.array(results)
    plt.scatter(A[:,0],A[:,1],s=5,alpha=0.5)
    plt.xlabel('current OVR')
    plt.yticks([],[])
    i+=1
plt.suptitle('Alt OVR comp',size=18,weight='bold',y=1.02)
plt.tight_layout()



sorted([(round(sum(v.values()),2),k) for k,v in future_use.items()],reverse=True)






rts = defaultdict(list)

player_ratings = {}
player_pos = {}
player_r1 = {}
player_r2 = {}



for file in sorted(os.listdir('.')):
    if fnmatch.fnmatch(file, 'FBGM_League*.json'):
        print(file)
        data = json.load(open(file,'rt',encoding='utf-8-sig'))


        valid_pos = set()
        for p in data['players']:
            for r in p['ratings']:
                r2 = sum([future_use[r['pos']][k]*v for k,v in r.items() if type(v) == int and k != 'season' and k in future_use[r['pos']]])
                
                key = (file,p['pid'],r['season'])
                player_ratings[key] ={k:v for k,v in r.items() if type(v) == int and k != 'season'}
                player_pos[key] =r['pos']
                player_r1[key] = r['ovr']
                player_r2[key] = r2

                valid_pos.add(r['pos'])



base = json.load(open('base_ur.json','rt',encoding='utf-8-sig'))
print(len(base['players']))
base['players'] = [_ for _ in base['players'] if _['tid'] != 31]
base['players'] = [_ for _ in base['players'] if _['tid'] != 30]

print(len(base['players']))
if "depth" in base['teams'][-1]:
    del base['teams'][-1]['depth']
if "stats" in base['teams'][-1]:
    del base['teams'][-1]['stats']
max_pid = max([_['pid'] for _ in base['players']])
base['gameAttributes']['userTid'] = 31
base['gameAttributes']['userTids'] = [31]



count = {'QB':3,'RB':4,'WR':6,'TE':3,'OL':9,'K':1,'P':1,'DL':9,'LB':7,'CB':5,'S':5}

min_ovr = {'QB':45,'RB':35,'WR':35,'TE':35,'OL':56,'K':70,'P':70,'DL':57,'LB':50,'CB':48,'S':50}
alt_t = []

for p,N in count.items():
    mo = min_ovr[p]
    pc = {k:v for k,v in player_r1.items() if v < mo and player_pos[k] == p}
    alts = sorted([(player_r2[k],k) for k in pc],reverse=True)
    done_set = set()
    i = 0
    icnt = len(alt_t)
    while len(alt_t) < icnt + N:
        _, k = alts[i]
        if k not in done_set:
            player = {'ratings':[player_ratings[k]],'pos':p}
            alt_t.append(player)
            done_set.add(k)
        i+=1
for p in alt_t:
    p['born'] =  {'year': 1994, 'loc': 'USA'}
    p['pid'] = max_pid
    p['tid'] = 31
    max_pid += 1
    base['players'].append(p)



min_ovr = {'QB':65,'RB':65,'WR':65,'TE':65,'OL':62,'K':50,'P':50,'DL':55,'LB':55,'CB':60,'S':60}

alt_t = []

for p,N in count.items():
    mo = min_ovr[p]
    pc = {k:v for k,v in player_r1.items() if v > mo and player_pos[k] == p}
    alts = sorted([(player_r2[k],k) for k in pc])#,reverse=True)
    done_set = set()
    i = 0
    icnt = len(alt_t)
    while len(alt_t) < icnt + N:
        _, k = alts[i]
        if k not in done_set:
            player = {'ratings':[player_ratings[k]],'pos':p}
            alt_t.append(player)
            done_set.add(k)
        i+=1
for p in alt_t:
    p['born'] =  {'year': 1994, 'loc': 'USA'}
    p['pid'] = max_pid
    p['tid'] = 30
    max_pid += 1
    base['players'].append(p)






with open('overunder.json','wt') as fp:
    json.dump(base,fp)



p










