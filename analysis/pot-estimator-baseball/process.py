import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression

dataset = pd.read_csv('data.csv')
dataset = dataset[dataset.Age <= 28]

positions = [
    "SP",
	"RP",
	"C",
	"1B",
	"2B",
	"3B",
	"SS",
	"LF",
	"CF",
	"RF",
	"DH",
]
for pos in positions:
    dataset['AgeOvr' + pos] = dataset['Age'] * dataset['Ovr' + pos]
    reg = LinearRegression()
    reg.fit(dataset[['Age', 'Ovr' + pos, 'AgeOvr' + pos]], dataset['Pot' + pos])
    print(pos)
    print('Intercept: \n', reg.intercept_)
    print('Coefficients: \n', reg.coef_)

    '''
    dataset['Pot_pred'] = reg.predict(dataset[['Age', 'Ovr' + pos, 'AgeOvr' + pos]])
    print(dataset[['Age', 'Ovr' + pos, 'Pot' + pos, 'Pot_pred']])

    dataset.plot.hexbin(x='Pot' + pos, y='Pot_pred', gridsize=20)
    plt.xlim(0, 100)
    plt.ylim(0, 100)
    plt.xlabel('Pot' + pos)  
    plt.ylabel('Pot_pred')  

    plt.plot([0, 100], [0, 100])

    plt.show()
    '''
