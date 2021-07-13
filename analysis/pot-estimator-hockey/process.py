import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

dataset = pd.read_csv('data.csv')
dataset = dataset[dataset.Age <= 28]
dataset['AgeOvr'] = dataset['Age'] * dataset['Ovr']

positions = ['C', 'W', 'D', 'G']
for pos in positions:
    subset = dataset[dataset['Pos'] == pos]

    reg = LinearRegression()
    reg.fit(subset[['Age', 'Ovr', 'AgeOvr']], subset['Pot'])
    print(pos)
    print('Intercept: \n', reg.intercept_)
    print('Coefficients: \n', reg.coef_)

    '''
    subset['Pot_pred'] = reg.predict(subset[['Age', 'Ovr']])
    print(subset[['Age', 'Ovr', 'Pot', 'Pot_pred']])

    subset.plot.hexbin(x='Pot', y='Pot_pred', gridsize=20)
    plt.xlim(0, 100)
    plt.ylim(0, 100)
    plt.xlabel('Pot')  
    plt.ylabel('Pot_pred')  

    plt.plot([0, 100], [0, 100])

    plt.show()
    '''
