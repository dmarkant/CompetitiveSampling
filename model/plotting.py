import matplotlib.pyplot as plt
from gambles import *
from expiration import *


def plot_gamble(g, xlim=[-100, 100]):

    fig, ax = plt.subplots(figsize=(4, 2))
    ax.plot([0, 0], [-2, 2], linestyle='--', c='gray')
    ax.plot([g['H'][0], g['H'][1]], [1, 1], marker='o', markeredgewidth=0, linestyle='-', color='red')
    ax.plot([g['L'][0], g['L'][1]], [-1, -1], marker='o', markeredgewidth=0, linestyle='-', color='blue')
    ax.plot([expected_value(g['H'])], [1], marker='x', markersize=14, color='red')
    ax.plot([expected_value(g['L'])], [-1], marker='x', markersize=14, color='blue')
    ax.set_xlim(xlim)
    ax.set_ylim([-2, 2])
    ax.axes.get_yaxis().set_visible(False)
    return fig, ax



def plot_effect_of_num_samples(g, maxsamp):

    pH = np.array([prob_choose_H_all_allocations(g, n) for n in range(1, maxsamp)])

    ev_random = 0.5 * expected_value(g['H']) + 0.5 * expected_value(g['L'])
    eg = (pH * expected_value(g['H']) + (1 - pH) * expected_value(g['L'])) - ev_random

    maxsamp_per_option = 12
    ediff = expected_difference_over_sample_size(g, maxsamp_per_option)

    fig, ax = plt.subplots(1, 3, figsize=(12,4))
    ax[0].plot(range(1,maxsamp), pH)
    ax[0].set_title('Probability of choosing H')
    ax[0].set_xlabel('total # samples')
    ax[0].set_ylabel('p(get H)')

    ax[1].plot(range(1,maxsamp), eg)
    ax[1].set_title('Expected gain relative to random choice')
    ax[1].set_xlabel('total # samples')
    ax[1].set_ylabel('expected gain')

    ax[2].plot(range(1,maxsamp_per_option), ediff)
    ax[2].set_title('Expected difference between mean values')
    ax[2].set_xlabel('# samples per option')
    ax[2].set_ylabel('expected difference')

    fig.subplots_adjust(wspace=.5)

    return fig, ax


