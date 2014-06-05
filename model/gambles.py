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
from random import random
from scipy.stats import binom


def value_given_outcomes(option, N_pos, N_neg):
    pos, neg, p = option
    return N_pos * pos + N_neg * neg


def expected_value(option):
    O_pos, O_neg, p_pos = option
    return O_pos * p_pos + O_neg * (1 - p_pos)


def midpoint(option):
    O_pos, O_neg, p_pos = option
    return (O_pos + O_neg)/2.


def spread(option):
    O_pos, O_neg, p_pos = option
    return (O_pos - O_neg)


def gamble_differences(g):
    return expected_value(g['H']) - expected_value(g['L']), \
           midpoint(g['H']) - midpoint(g['L']), \
           spread(g['H']) - spread(g['L'])



def generate_option(pos_range=[1, 101], neg_range=[-100, 0], p_range=[0, 1]):
    pos = np.random.randint(pos_range[0], pos_range[1])
    neg = np.random.randint(neg_range[0], neg_range[1])
    p = p_range[0] + np.random.random()*(p_range[1]-p_range[0])
    return (pos, neg, p)



def generate_gamble(pos_range=[1, 101], neg_range=[-100, 0], p_range=[0, 1]):

    A_pos = np.random.randint(pos_range[0], pos_range[1])
    A_neg = np.random.randint(neg_range[0], neg_range[1])
    A_p = p_range[0] + np.random.random()*(p_range[1]-p_range[0])

    B_pos = np.random.randint(pos_range[0], pos_range[1])
    B_neg = np.random.randint(neg_range[0], neg_range[1])
    B_p = p_range[0] + np.random.random()*(p_range[1]-p_range[0])

    A_ev = expected_value((A_pos, A_neg, A_p))
    B_ev = expected_value((B_pos, B_neg, B_p))

    if A_ev > B_ev:
        H = (A_pos, A_neg, A_p)
        L = (B_pos, B_neg, B_p)
    else:
        H = (B_pos, B_neg, B_p)
        L = (A_pos, A_neg, A_p)

    return {"H": H, "L": L}


def generate_gamble_posneg(pos_range=[1, 101], neg_range=[-100, 0], p_range=[0, 1]):
    done = False
    while not done:
        g = generate_gamble(pos_range=pos_range, neg_range=neg_range, p_range=p_range)
        if expected_value(g['H']) > 0 and expected_value(g['L']) < 0:
            done = True
    return g


def generate_gamble_nondom(pos_range=[1, 101], neg_range=[-100, 0], p_range=[0, 1]):

    done = False
    while not done:
        g = generate_gamble(pos_range=pos_range, neg_range=neg_range, p_range=p_range)
        if ((g['H'][0] > g['L'][0] and g['H'][1] < g['L'][1]) or (g['H'][0] < g['L'][0] and g['H'][1] > g['L'][1])):
            done = True
    return g


def generate_gamble_posneg_nondom(pos_range=[1, 101], neg_range=[-100, 0], p_range=[0, 1]):

    done = False
    while not done:
        g = generate_gamble(pos_range=pos_range, neg_range=neg_range, p_range=p_range)
        if ((g['H'][0] > g['L'][0] and g['H'][1] < g['L'][1]) or (g['H'][0] < g['L'][0] and g['H'][1] > g['L'][1])) and expected_value(g['H']) > 0 and expected_value(g['L']) < 0:
            done = True
    return g

def generate_gamble_posneg_nondom_fixed_outcomes(A_pos, A_neg, B_pos, B_neg, A_p_range=[0,1], B_p_range=[0,1]):

    done = False
    while not done:
        A_p = A_p_range[0] + np.random.random()*(A_p_range[1]-A_p_range[0])
        B_p = B_p_range[0] + np.random.random()*(B_p_range[1]-B_p_range[0])
        A_ev = expected_value((A_pos, A_neg, A_p))
        B_ev = expected_value((B_pos, B_neg, B_p))
        if A_ev > B_ev:
            H = (A_pos, A_neg, A_p)
            L = (B_pos, B_neg, B_p)
        else:
            H = (B_pos, B_neg, B_p)
            L = (A_pos, A_neg, A_p)
        g = {"H": H, "L": L}

        if ((g['H'][0] > g['L'][0] and g['H'][1] < g['L'][1]) or (g['H'][0] < g['L'][0] and g['H'][1] > g['L'][1])) and expected_value(g['H']) > 0 and expected_value(g['L']) < 0:
            done = True
    return g



def generate_gamble_fixed_values(value_pos, value_neg):
    A_pos = value_pos
    A_neg = value_neg
    B_pos = value_pos
    B_neg = value_neg

    A_p = np.random.random()
    B_p = np.random.random()

    A_ev = expected_value((A_pos, A_neg, A_p))
    B_ev = expected_value((B_pos, B_neg, B_p))

    if A_ev > B_ev:
        H = (A_pos, A_neg, A_p)
        L = (B_pos, B_neg, B_p)
    else:
        H = (B_pos, B_neg, B_p)
        L = (A_pos, A_neg, A_p)

    return {"H": H, "L": L}


def generate_gamble_prob_range(A_range=[0., 1.], B_range=[0., 1.]):

    A_pos = np.random.randint(0, 101)
    A_neg = np.random.randint(-100, 1)
    A_p = np.random.uniform(A_range[0], A_range[1])

    B_pos = np.random.randint(0, 101)
    B_neg = np.random.randint(-100, 1)
    B_p = np.random.uniform(B_range[0], B_range[1])

    A_ev = expected_value((A_pos, A_neg, A_p))
    B_ev = expected_value((B_pos, B_neg, B_p))

    if A_ev > B_ev:
        H = (A_pos, A_neg, A_p)
        L = (B_pos, B_neg, B_p)
    else:
        H = (B_pos, B_neg, B_p)
        L = (A_pos, A_neg, A_p)

    return {"H": H, "L": L}


def print_gamble(opt):
    print "high option: %s (EV: %s)" % (opt["H"], expected_value(opt["H"]))
    print "low option: %s (EV: %s)" % (opt["L"], expected_value(opt["L"]))

    ev, m, s = gamble_differences(opt)
    print "difference in expected value: %s" % ev
    print "difference in median: %s" % m
    print "difference in spread: %s" % s



def option_sample_means_and_probs(option, N):
    pos, neg, p = option
    mns = []
    probs = []

    for n in range(0, N + 1):
        mn = (n * pos + (N - n) * neg) / float(N)
        prob = binom.pmf(n, N, p)
        mns.append(mn)
        probs.append(prob)

    return np.array(mns), np.array(probs)
