import json
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.linear_model import LinearRegression

params = {
    "basketball": {
        "ovrMean": 44.88120567375886,
        "ovrStd": 11.120793951909148,
        "salaryCap": 90000,
    },
    "football": {
        "ovrMean": 45.66901027582477,
        "ovrStd": 12.94063146944189,
        "salaryCap": 200000,
    },
}

for sport in ["basketball", "football"]:
    values = []
    amounts = []

    with open(f'{sport}.json', encoding='utf-8-sig') as f:
        data = json.load(f)

        for p in data['players']:
            if p['tid'] < -1:
                continue

            values.append((p['value'] - params[sport]['ovrMean']) / params[sport]['ovrStd'])
            amounts.append(p['contract']['amount'] / params[sport]['salaryCap'])

    df = pd.DataFrame(data={ "value": values, "amount": amounts })
    print(df)

    reg = LinearRegression(normalize=True)
    reg.fit(df[['value']], df['amount'])
    print('Intercept: \n', reg.intercept_)
    print('Coefficients: \n', reg.coef_)

    amount_fit = reg.predict(df[['value']])

    df.plot.scatter(x='value', y='amount')
    plt.plot(df[['value']], amount_fit, color='blue', linewidth=3)
    plt.show()
