"""
Wrapper that patches torch.load before running whisperx CLI.

PyTorch 2.6+ changed weights_only default to True, which breaks
pyannote model loading. This wrapper patches torch.load to use
weights_only=False before whisperx imports pyannote.
"""
import torch

_original_load = torch.load

def _patched_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)

torch.load = _patched_load

# Now run whisperx CLI
from whisperx.__main__ import cli
cli()
