"""Padding helpers for Granite PatchTST zero-shot experiments.

Granite PatchTST checkpoints are commonly configured with a longer context
window than a local experiment. These helpers are intentionally small and
notebook-friendly so the padding behavior is explicit when the IBM baseline is
enabled.
"""

from __future__ import annotations

from typing import Any, Dict

import numpy as np
import torch


def left_pad_array(values: np.ndarray, target_length: int, pad_value: float = 0.0) -> np.ndarray:
    """Left-pad a time-major array to `target_length`.

    Args:
        values: Array with shape `(time, channels)` or `(time,)`.
        target_length: Desired first-dimension length.
        pad_value: Value used for missing history.

    Returns:
        The original array if it is long enough, otherwise a left-padded copy.
    """

    array = np.asarray(values)
    if array.shape[0] >= target_length:
        return array[-target_length:]

    pad_width = [(target_length - array.shape[0], 0)]
    pad_width.extend((0, 0) for _ in array.shape[1:])
    return np.pad(array, pad_width=pad_width, mode="constant", constant_values=pad_value)


def left_pad_tensor(values: torch.Tensor, target_length: int, pad_value: float = 0.0) -> torch.Tensor:
    """Left-pad a tensor on the time dimension.

    Supports tensors shaped `(time, channels)` and batched tensors shaped
    `(batch, time, channels)`.
    """

    if values.ndim not in (2, 3):
        raise ValueError("Expected a 2D or 3D tensor for time-series padding.")

    time_dim = -2
    current_length = values.shape[time_dim]
    if current_length >= target_length:
        slicer = [slice(None)] * values.ndim
        slicer[time_dim] = slice(current_length - target_length, current_length)
        return values[tuple(slicer)]

    pad_shape = list(values.shape)
    pad_shape[time_dim] = target_length - current_length
    pad_tensor = values.new_full(pad_shape, pad_value)
    return torch.cat([pad_tensor, values], dim=time_dim)


def pad_batch_for_granite(batch: Dict[str, Any], context_length: int, pad_value: float = 0.0) -> Dict[str, Any]:
    """Pad `past_values` in a dataset batch for Granite's expected context length."""

    padded = dict(batch)
    past_values = padded.get("past_values")
    if past_values is None:
        return padded

    if isinstance(past_values, torch.Tensor):
        padded["past_values"] = left_pad_tensor(past_values, context_length, pad_value)
    else:
        padded["past_values"] = left_pad_array(np.asarray(past_values), context_length, pad_value)

    return padded
