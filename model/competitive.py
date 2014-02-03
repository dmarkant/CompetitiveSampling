"""
Comparing advantage of choosing vs. deferring choice
across different types of gambles.

Created 16.01.14
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
Individual setting.

For a fixed number of samples, and assuming a simple decision rule
that people will select the option with the higher sample mean,
what is the likelihood that people will end up choosing the H option?

"""


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

        #print 'number of samples resulting in positive outcome: %s' % n
        #print 'prob of that happening: %s' % prob
        #print 'observed sample mean: %s' % mn

        mns.append(mn)
        probs.append(prob)

    return np.array(mns), np.array(probs)


def prob_choose_H(options, num_samples_H, num_samples_L):
    """For a given gamble and an allocation of samples to each option,
    find the probability of selecting the H option (summing across
    possible observed frequencies of positive and negative outcomes"""

    mns_H, probs_H = option_sample_means_and_probs(options['H'], num_samples_H)
    mns_L, probs_L = option_sample_means_and_probs(options['L'], num_samples_L)

    tot = 0.
    for i in range(num_samples_H + 1):
        tot += np.sum(probs_H[i] * probs_L[mns_H[i] > mns_L]) + np.sum(0.5 * probs_H[i] * probs_L[mns_H[i] == mns_L])

    return tot


"""
Competitive setting.

For a fixed number of samples for each player, what is the probability
that an agent obtains the H option if they are the chooser vs. if they
are the receiver?

"""
agent_num_samples = 2
opponent_num_samples = 2

options = generate_gamble()

def competitive_prob_get_H(options, agent_num_samples, opponent_num_samples):

    if agent_num_samples < opponent_num_samples:
        chooser = "agent"
        p_get_H_agent = prob_choose_H(options, agent_num_samples / 2, agent_num_samples / 2)
        p_get_H_opponent = 1 - p_get_H_agent

    elif agent_num_samples > opponent_num_samples:
        chooser = "opponent"
        p_get_H_opponent = prob_choose_H(options, opponent_num_samples / 2, opponent_num_samples / 2)
        p_get_H_agent = 1 - p_get_H_opponent

    elif agent_num_samples == opponent_num_samples:
        # in this case the two players are identical

        chooser = "tie"

        N = agent_num_samples
        p_choose_H = prob_choose_H(options, N/2, N/2)
        p_choose_L = 1 - p_choose_H

        # probability that players choose different options
        p_diff = p_choose_H * (1 - p_choose_H)
        p_both_H = p_choose_H * p_choose_H
        p_both_L = p_choose_L * p_choose_L

        p_get_H_agent = p_diff + (0.5 * p_both_H) + (0.5 * p_both_L)
        p_get_H_opponent = 1 - p_get_H_agent

    return {"chooser": chooser,
            "p_get_H_agent": p_get_H_agent,
            "p_get_H_opponent": p_get_H_opponent
            }

def competitive_expected_gain(options, agent_num_samples, opponent_num_samples):

    # get probability
    result = competitive_prob_get_H(options, agent_num_samples, opponent_num_samples)
    pH_agent = result['p_get_H_agent']
    pH_opponent = result['p_get_H_opponent']

    gain_agent = expected_value(options['H']) * pH_agent + \
                 expected_value(options['L']) * (1 - pH_agent)

    gain_opponent = expected_value(options['H']) * pH_opponent + \
                    expected_value(options['L']) * (1 - pH_opponent)

    return gain_agent, gain_opponent

