# PolyScore

## Trader Score System
PolyScore calculates a trader's historical accuracy and risk profile.

## Formula
PolyScore leverages the Brier Score calculation:
$$BS = \frac{1}{N} \sum_{t=1}^{N} (f_t - o_t)^2$$
Where:
* $f_t$ is the forecast probability (e.g., price paid for share, e.g. $0.64$ for $64$¢)
* $o_t$ is the actual outcome ($1$ if occurred, $0$ if not)

A lower Brier Score indicates higher forecasting accuracy. The final **PolyScore** maps this to a 0-100 rating scale.
