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
from numpy.random import binomial
from gambles import *
import random



"""
Individual setting.

For a fixed number of samples, and assuming a simple decision rule
that people will select the option with the higher sample mean,
what is the likelihood that people will end up choosing the H option?

"""

def simulate_sample_mean(opt, N, prior=0):
    """Randomly sample N outcomes from opt and return
    sample mean.

    If N==0, return prior value.
    """
    pos, neg, p = opt
    if N == 0:
        return prior
    else:
        n_pos = binomial(N, p)
        v = (n_pos * pos + (N - n_pos) * neg) / float(N)
        return v


def expected_sample_mean(opt, N):
    est_values, probs = option_sample_means_and_probs(opt, N)
    est = np.sum([probs[i] * est_values[i] for i in range(len(est_values))])
    return est


def expected_absolute_error(opt, N):
    ev = expected_value(opt)
    est_values, probs = option_sample_means_and_probs(opt, N)
    w_abs_error = [probs[i] * np.abs(est_values[i] - ev) for i in range(len(est_values))]
    return np.sum(w_abs_error)


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





"""
Agent-based simulation


"""
def sample_stop_trials(comp_env, T_MAX, C):

    if comp_env is 'uniform':
        stoptrials = np.random.randint(1, T_MAX, C)

    return stoptrials


def sample_preference_orders(options, n_samples, n_stopping):
    pref_orders = []
    for i in range(n_stopping):

        # assign sampling trials to options
        sampled_options = np.random.choice(range(len(options)), n_samples)

        # count samples per option
        n_sample_by_option = [np.sum(sampled_options==i) for i in range(len(options))]

        # get estimated value of each option based on # of samples
        if np.min(n_sample_by_option)==0:
            # if one of the options hasn't been sampled yet, prefer the one
            # that has
            est_value = np.array([n for n in n_sample_by_option])
        else:
            est_value = np.array([simulate_sample_mean(options[i], n_sample_by_option[i], prior=50) for i in range(len(options))])
        pref_orders.append((-est_value).argsort())

    return pref_orders


def resolve_choices(consumed, pref_orders, choice_order, includeself=False):
    obtained_index = None

    # for each chooser, go through ranked preferences and
    # consume the first one that is available
    for chooser in choice_order:

        done = False
        i = -1
        while not done:
            i += 1

            option_index = pref_orders[chooser][i]
            if option_index not in consumed:
                consumed.append(option_index)
                done = True

                if chooser==0 and includeself:
                    obtained_index = option_index

    return consumed, obtained_index



def sim_obtained_loss(opt, C=1, target_trial=1, T_MAX=50, comp_env='uniform'):
    """
    Agent-based simulation, returning the obtained loss relative to best option
    opt: option set

    Keyword args:
    C -- number of competitors (in addition to self)
    target_trial -- trial on which loss is evaluated
    comp_env -- the competition environment; belief about others' stopping
    """
    options = [opt['H'][:3], opt['L'][:3]]
    expected_values = [opt['H'][3], opt['L'][3]]

    stoptrials = sample_stop_trials(comp_env, T_MAX, C)
    consumed = []
    obtained_value = None

    for trial in range(1, target_trial+1):

        # get preference orders for all stopping competitors
        pref_orders = []
        n_stopping = np.sum(stoptrials==trial)
        other_pref_orders = sample_preference_orders(options, trial, n_stopping)

        if trial==target_trial:
            pref_orders = sample_preference_orders(options, trial, 1)
            n_stopping += 1 # add self to number of people stopping on this trial

        # get preference orders for others
        for po in other_pref_orders:
            pref_orders.append(po)

        #print 'pref_orders:', pref_orders

        # get randomized choice order
        choice_order = range(n_stopping)
        random.shuffle(choice_order)

        # resolve choices
        consumed, obtained_ind = resolve_choices(consumed, pref_orders, choice_order, includeself=True if trial==target_trial else False)

    obtained_value = expected_values[obtained_ind]
    best = np.max(expected_values)
    return best - obtained_value


def sim_obtained_loss_given_stop_time(opt, comp_stop_trial, own_stop_trial):
    """
    Agent-based simulation, returning the obtained loss relative to best option
    opt: option set

    Keyword args:
    C -- number of competitors (in addition to self)
    target_trial -- trial on which loss is evaluated
    comp_env -- the competition environment; belief about others' stopping
    """
    options = [opt['H'][:3], opt['L'][:3]]
    expected_values = [opt['H'][3], opt['L'][3]]

    stoptrials = np.array([comp_stop_trial])
    target_trial = own_stop_trial
    consumed = []
    obtained_value = None

    for trial in range(1, target_trial+1):

        # get preference orders for all stopping competitors
        pref_orders = []

        n_stopping = np.sum(stoptrials==trial)
        other_pref_orders = sample_preference_orders(options, trial, n_stopping)

        if trial==target_trial:
            pref_orders = sample_preference_orders(options, trial, 1)
            n_stopping += 1 # add self to number of people stopping on this trial

        # get preference orders for others
        for po in other_pref_orders:
            pref_orders.append(po)

        #print n_stopping
        #print pref_orders

        # get randomized choice order
        choice_order = range(n_stopping)
        random.shuffle(choice_order)

        # resolve choices
        consumed, obtained_ind = resolve_choices(consumed, pref_orders, choice_order, includeself=True if trial==target_trial else False)

    obtained_value = expected_values[obtained_ind]
    best = np.max(expected_values)
    return best - obtained_value


