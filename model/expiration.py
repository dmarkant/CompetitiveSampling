"""
Modeling search decisions in sampling by experience
paradigm with choice expiration.

Created 3.02.14
Doug Markant


# Gambles

A given gamble is specified by the following values:

    A_pos:     The value of the positive outcome from option A
    A_neg:     The value of the negative outcome from option A
    p(A_pos):  The probability of the positive outcome under A

    B_pos:     The value of the positive outcome from option B
    B_neg:     The value of the negative outcome from option B
    p(B_pos):  The probability of the positive outcome under B


Each option is generated according to the following:

    *_pos ~ U(0, 100)
    *_neg ~ U(-100, 0)

    p(*_pos) ~ U(0, 1)
    p(*_neg) = 1 - p(*_pos)

After sampling, the option with the higher expected value is
labeled the "H" option.


"""

import numpy as np
from scipy.stats import binom
from gambles import *



"""
Individual setting


Want to get rid of some of the assumptions from the previous
model.

Here, not playing against an opponent. Instead, the player is
told that one of the options will expire (thereby removing
their ability to choose).

Different possible expiration conditions:

    1) random, independent expiration

    2) only one option expires, but don't know which one or when
       (in other words, lose ability to choose upon expiration,
       as will be stuck with a randomly chosen option)

    3) only the H option expires, but don't know when
       (here lose ability to choose, and deterministically stuck
       with the L option)

    4) only the H option expires, and told when


Simplest condition to begin with is the following:

    - one option is randomly selected, and assigned an expiration
      according to some distribution F_EXP

    - the other option expires at a fixed time, T_END, which is the
      maximum # of samples that could feasibly be taken


Given understanding of F_EXP, do people adjust how long they explore?

    - for example, if F_EXP is a known, fixed value, do people sample
      up until that point?

    - if F_EXP is a distribution (e.g., uniform, or normal), how
      do people change how long they explore?


And for all of these conditions, what does the optimal model predict
that people should do?

"""

T_END = 25



def option_sample_means_and_probs(option, N):
    """Given an option and a total number of samples drawn from
    that option, find the set of possible observed means and the
    probabilities of those outcomes"""

    pos, neg, p = option

    mns = []
    probs = []

    for n in range(0, N + 1):

        mn = n * pos + (N - n) * neg
        prob = binom.pmf(n, N, p)
        mns.append(mn)
        probs.append(prob)

    return np.array(mns), np.array(probs)


def prob_choose_H(options, num_samples_H, num_samples_L):
    """For a given gamble and an allocation of samples to each option,
    find the probability of selecting the H option (summing across
    possible observed frequencies of positive and negative outcomes"""

    assert num_samples_H + num_samples_L > 0

    # if one of the allocations is 0, then use simple decision rule based
    # on other sample (if positive, choose; if negative, choose other one)
    if num_samples_H == 0:

        mns_L, probs_L = option_sample_means_and_probs(options['L'], num_samples_L)

        # probability of choosing the H option in this case is the
        # probability that mns_L is less than zero (or that it equals zero,
        # in which case a coin is flipped)
        tot = np.sum(probs_L[mns_L < 0]) + np.sum(0.5 * probs_L[mns_L == 0])

    elif num_samples_L == 0:

        mns_H, probs_H = option_sample_means_and_probs(options['H'], num_samples_H)

        # probability of choosing the H option is the probability that mns_H
        # is greater than zero (or coin flip if equals zero)
        tot = np.sum(probs_H[mns_H > 0]) + np.sum(0.5 * probs_H[mns_H == 0])

    else:

        mns_H, probs_H = option_sample_means_and_probs(options['H'], num_samples_H)
        mns_L, probs_L = option_sample_means_and_probs(options['L'], num_samples_L)

        tot = 0.
        for i in range(num_samples_H + 1):
            tot += np.sum(probs_H[i] * probs_L[mns_H[i] > mns_L]) + np.sum(0.5 * probs_H[i] * probs_L[mns_H[i] == mns_L])

    return tot


def prob_choose_H_all_allocations(options, num_samples):
    """For a given gamble and a total number of samples, find the
    probability of selecting the H option, integrating over all
    possible allocations to the two options"""

    p = 1./(num_samples + 1)

    # prob of choosing H for each possible allocation beteween the two options
    return np.sum(p * np.array([prob_choose_H(options, n, num_samples - n) for n in range(num_samples + 1)]))


def expected_gain_given_uniform_expiration(options, p_expire, max_samples):
    """For a given gamble and a probability distribution defining
    the expiration of one option, what is the optimal number of
    samples?"""

    ev_high = expected_value(options['H'])
    ev_low  = expected_value(options['L'])

    ev_random = 0.5 * ev_high + 0.5 * ev_low

    eg = np.zeros(max_samples, float)
    for trial in range(1, max_samples):

        # what is the expected value of *planning* to sample
        # this many times?

        p_exp_cum = np.sum([p_expire for _ in range(trial-1)])
        pH = prob_choose_H_all_allocations(options, trial)
        eg[trial] = (1 - p_exp_cum) * (pH * ev_high + (1 - pH) * ev_low) + p_exp_cum * ev_random

    return eg



if __name__=="__main__":
    g = generate_gamble_posneg()
    print_gamble(g)
    prob_choose_H_all_allocations(g, 10)

    print sample_duration_given_uniform_expiration(g, .3, 25)
