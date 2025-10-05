# Routine ID Generator

A web-based tool for building and sharing university class schedules. It bundles a Base69 "Section Compressor" that turns six-digit section IDs into compact routine strings you can copy, store, or share.

## Overview

- **Frontend**: `index.html` (Tailwind-powered UI with clipboard helpers and dataset toggle).
- **Compressor**: `compressor.js` (bidirectional encoder/decoder exposed as `window.compressor`).
- **Datasets**: `fallback.json` (offline archive) plus the live CDN source.
- **Tooling**: `check_section_ids.py` for auditing datasets against supported ranges.

## Encoding scheme (encryptor)

The encoder converts each six-digit section ID into a four-character Base69 token so that shareable routines look like `#abcdWXYZ...`.

1. Normalize input: strip non-digits, ensure a six-digit integer between **100000** and **999999**.
2. Subtract the minimum (`offset = id - 100000`) to obtain a zero-based value.
3. Convert the offset to Base69 using the alphabet `0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+.%@*$!`.
4. Emit **exactly four characters** per section and prefix the full routine with `#`.
5. When no valid sections are present, the encoder returns `#0000` as a sentinel.

This yields 22,244,961 distinct codes—far more than the 900,000 possible section IDs—so future ranges are covered.

### JavaScript usage

```javascript
const routineId = compressor.compressForCopy(['176329', '182113']);
// routineId -> '#0g2f0hh3'
```

Each call validates inputs and skips anything outside the supported bounds. Invalid IDs are logged with context to help diagnose data issues.

## Decoding instructions (decryptor)

Consumers should reverse the process as follows:

1. Require the routine string to start with `#`. If you persist metadata after a `~`, ignore it during decoding.
2. Inspect the payload (characters after `#` and before `~` if present). The length **must** be divisible by four.
3. For each four-character chunk, map every character back to its index within the Base69 alphabet.
4. Rebuild the offset: `offset = a*69³ + b*69² + c*69 + d`.
5. Add the base (`id = 100000 + offset`) and left-pad to six digits.

Example in JavaScript:

```javascript
const ids = compressor.decompressRoutine('#0g2f0hh3');
// ids -> ['176329', '182113']
```

Your own decryptor implementation can follow the same formulas. Ensure you validate characters against the alphabet to guard against tampered strings.

## Dataset verification

Use the supplied Python helper to confirm any dataset stays within the supported six-digit window:

```powershell
python check_section_ids.py
```

The script reports the total rows processed plus the minimum and maximum IDs found. Any out-of-range values are listed for quick debugging.

## Development notes

- Clipboard writes rely on the modern `navigator.clipboard` API with a fallback for older browsers.
- The app caches the last routine ID in `sessionStorage` so users can pick up where they left off within a session.
- When the live CDN is unreachable, the UI automatically falls back to `fallback.json` and flags the event in the console.

For maintainers migrating older data, load the page locally, import your dataset, and run the analyzer before sharing new routine IDs.
