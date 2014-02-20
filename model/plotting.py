import matplotlib.pyplot as plt
from gambles import *

def plot_gamble(g):

    fig, ax = plt.subplots(figsize=(4,2))
    ax.plot([0, 0], [-2, 2], linestyle='--', c='gray')
    ax.plot([g['H'][0], g['H'][1]], [1, 1], marker='o', markeredgewidth=0, linestyle='-', color='red')
    ax.plot([g['L'][0], g['L'][1]], [-1, -1], marker='o', markeredgewidth=0, linestyle='-', color='blue')
    ax.plot([expected_value(g['H'])], [1], marker='x', markersize=14, color='red')
    ax.plot([expected_value(g['L'])], [-1], marker='x', markersize=14, color='blue')
    ax.set_xlim([-100, 100])
    ax.set_ylim([-2, 2])
    ax.axes.get_yaxis().set_visible(False)
    return fig, ax
