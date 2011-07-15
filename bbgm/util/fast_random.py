"""
bbgm.util.fast_random

This module will use numpy.random when it is both available and faster than
Python's native random, but it will gracefully fallback to random if numpy is
not available.

In practice, using this speeds up game simulation by about 10% just by using
numpy.random.normal rather than random.gauss.
"""

from bbgm import common

use_numpy = False
if common.NUMPY:
    try:
        import numpy.random
        use_numpy = True
    except ImportError:
        import random
else:
    import random

if common.DEBUG:
    if use_numpy:
        print 'bbgm.core.fast_random is using numpy (fast)'
    else:
        print 'bbgm.core.fast_random is using random (slow)'


def gauss(mu, sigma):
    if use_numpy:
        return numpy.random.normal(mu, sigma)
    else:
        return random.gauss(mu, sigma)
