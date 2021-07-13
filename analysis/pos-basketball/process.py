import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict

dirname = os.path.dirname(__file__)
filename = os.path.join(dirname, '../../data/real-player-data.basketball.json')
data = json.load(open(filename,'rb'))

df = pd.DataFrame(data['ratings'])

df = df.drop(['fuzz','abbrev_if_new_row'],1)

df = df.set_index(['slug','season']).reset_index()
print(df)

cols = list(df.columns[2:])

ratings = defaultdict(list)
for row in df.itertuples():
    ratings[row[1]].append(row[3:])
print(ratings)

X = []
names = []
pos_idx = {'PG':0,'SG':1,'SF':2,'PF':3,'C':4,'G':0.5,'F':2.5,'FC':3.5,'GF':1.5}

# okay but aren't GFs closer to PGs than SGs? Hair better results but obv different predictions
#pos_idx = {'PG':1,'SG':0,'SF':2,'PF':3,'C':4,'G':0.5,'F':2.5,'FC':3.5,'GF':1.5}

for k,p in data['bios'].items():
    pos = pos_idx[p['pos']]
    for y in ratings[k]:
        names.append(p['name'])
        X.append([pos] + list(y))

X=np.array(X)
y = X[:,0]
#X = X/np.mean(X[:,[False] + [_ != 'hgt2' for _ in cols]],axis=1,keepdims=1)
X = pd.DataFrame(X[:,1:],columns=cols)

import statsmodels.api as sm

clf = sm.OLS(y,sm.add_constant(X)).fit()#_regularized(alpha=1e-9, L1_wt=0.0001)
#clf = svm.LinearSVR()
#clf.fit(X,y)
#clf = sm.Logit(y/4,sm.add_constant(X)).fit()
print(clf.summary())

print(np.linalg.norm(y-clf.predict(sm.add_constant(X))))
print(clf.params)

pred = clf.predict(sm.add_constant(X))
plt.figure(dpi=200)
plt.scatter(y,pred,s=2,alpha=0.01)
plt.ylim(0,4)
yp = list(pos_idx.keys())
plt.yticks([pos_idx[k] for k in yp],yp)
plt.xticks([pos_idx[k] for k in yp],yp)

from collections import Counter
def get_pos(x):
    inv_pos_idx = [(abs(v-x),k) for k,v in pos_idx.items()]
    return sorted(inv_pos_idx)[0]

for n in ['LeBron James','Michael Jordan','Kobe Bryant','Chris Paul','James Harden','Stephen Curry','Kawhi Leonard','Tim Duncan','Kevin Garnett','Karl Malone','John Stockton']:
    idx = names.index(n)
    for i in range(idx,len(names)):
        if names[i] != n:
            break
    
    p = [get_pos(pred[j]) for j in range(idx,i)]
    print(n,dict(Counter([_[1] for _ in p])))



