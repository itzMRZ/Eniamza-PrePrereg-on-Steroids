/**
 * BASE69 SECTION ID COMPRESSOR & DECRYPTOR
 * ========================================
 *
 * PURPOSE:
 * - Compresses any 6-digit section ID (100000-999999) into 4-character codes
 * - Final output format: #abcd1234 where each 4-char group = one section ID
 *
 * HOW IT WORKS:
 * 1. Section IDs are normalized to integers between 100000 and 999999 inclusive
 * 2. Subtract the minimum (100000) to obtain a zero-based offset
 * 3. Encode the offset using four Base69 characters
 *
 * CHARSET USED (69 characters):
 * - Numbers: 0-9 (positions 0-9)
 * - Lowercase: a-z (positions 10-35)
 * - Uppercase: A-Z (positions 36-61)
 * - Special: +.%@*$! (positions 62-68)
 *
 * CAPACITY:
 * - Base69 with 4 chars: 69⁴ = 22,244,961 combinations
 * - Required range: 100000-999999 (900,000 combinations)
 * - Plenty of headroom for all future 6-digit IDs
 *
 * ENCODING FORMULA:
 * - offset = original_section_id - 100000
 * - char1_index = floor(offset / 69³)
 * - char2_index = floor((offset % 69³) / 69²)
 * - char3_index = floor((offset % 69²) / 69)
 * - char4_index = offset % 69
 * - encoded = charset[char1_index] + charset[char2_index] + charset[char3_index] + charset[char4_index]
 *
 * DECODING FORMULA (for creating decryptor):
 * - charX_index = charset.indexOf(encoded[X])
 * - offset = char1_index * 69³ + char2_index * 69² + char3_index * 69 + char4_index
 * - original_section_id = String(100000 + offset).padStart(6, '0')
 *
 * EXAMPLE:
 * - Input: 176329
 * - Offset from minimum: 176329 - 100000 = 76,329
 * - char1_index = floor(76,329 / 69³) = 0 → charset[0] = '0'
 * - char2_index = floor((76,329 % 69³) / 69²) = 16 → charset[16] = 'g'
 * - char3_index = floor((76,329 % 69²) / 69) = 2 → charset[2] = '2'
 * - char4_index = 76,329 % 69 = 15 → charset[15] = 'f'
 * - Output: "0g2f"
 *
 * REVERSE EXAMPLE:
 * - Input: "0g2f"
 * - char indices = 0, 16, 2, 15
 * - offset = 0 * 69³ + 16 * 69² + 2 * 69 + 15 = 76,329
 * - Output: 100000 + 76,329 = "176329"
 *
 * SAFETY FEATURES:
 * - Uses only safe ASCII characters (no emojis, no breaking chars)
 * - Always exactly 4 characters per section ID
 * - Reversible encoding/decoding with ample headroom for new IDs
 */

class SectionCompressor {
    constructor() {
        // Base69 charset: 69 ultra-safe characters (using @ instead of comma)
        this.charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+.%@*$!';
        this.base = 69;
        this.base2 = this.base * this.base; // 69² = 4,761
        this.base3 = this.base2 * this.base; // 69³ = 328,509
        this.base4 = this.base3 * this.base; // 69⁴ = 22,244,961
        this.minSectionId = 100000;
        this.maxSectionId = 999999;
    }

    parseSectionId(sectionId) {
        const idStr = String(sectionId).trim().replace(/[^\d]/g, '');
        if (idStr.length !== 6) {
            console.warn('[compressor] Expected a 6-digit section ID but received:', sectionId);
            return null;
        }

        const numericId = Number(idStr);
        if (!Number.isInteger(numericId)) {
            console.warn('[compressor] Section ID is not an integer:', sectionId);
            return null;
        }

        if (numericId < this.minSectionId || numericId > this.maxSectionId) {
            console.warn(
                `[compressor] Section ID ${numericId} is outside the encodable range ` +
                `${this.minSectionId}-${this.maxSectionId}.`
            );
            return null;
        }

        return numericId;
    }

    encodeNumeric(numericId) {
        const remaining = numericId - this.minSectionId;

        // Convert to exactly 4 characters using base69
        const char1Index = Math.floor(remaining / this.base3);
        const remAfterChar1 = remaining % this.base3;
        const char2Index = Math.floor(remAfterChar1 / this.base2);
        const remAfterChar2 = remAfterChar1 % this.base2;
        const char3Index = Math.floor(remAfterChar2 / this.base);
        const char4Index = remAfterChar2 % this.base;

        return (
            this.charset[char1Index] +
            this.charset[char2Index] +
            this.charset[char3Index] +
            this.charset[char4Index]
        );
    }

    encode(sectionId) {
        const numericId = this.parseSectionId(sectionId);

        if (numericId === null) {
            console.error('Invalid section ID:', sectionId);
            return '0000';
        }

        return this.encodeNumeric(numericId);
    }

    /**
     * Decodes a four-character payload back to the original six-digit string.
     */
    decode(encoded) {
        if (encoded.length !== 4) {
            throw new Error('Encoded string must be exactly 4 characters');
        }

        const index1 = this.charset.indexOf(encoded[0]);
        const index2 = this.charset.indexOf(encoded[1]);
        const index3 = this.charset.indexOf(encoded[2]);
        const index4 = this.charset.indexOf(encoded[3]);

        if (index1 === -1 || index2 === -1 || index3 === -1 || index4 === -1) {
            throw new Error('Invalid characters in encoded string');
        }

        const remaining =
            index1 * this.base3 +
            index2 * this.base2 +
            index3 * this.base +
            index4;

        const originalId = this.minSectionId + remaining;

        if (originalId > this.maxSectionId) {
            throw new Error('Decoded section ID exceeds supported range');
        }

        return originalId.toString().padStart(6, '0');
    }

    /**
     * Collapses an array of section IDs into a shareable routine string.
     * Returns "#0000" when no valid IDs were provided so the caller can short-circuit.
     */
    compressForCopy(sectionIds) {
        const normalizedIds = sectionIds
            .map(id => this.parseSectionId(id))
            .filter(id => id !== null);

        if (normalizedIds.length === 0) {
            return '#0000';
        }

        const encoded = normalizedIds.map(id => this.encodeNumeric(id));
        return '#' + encoded.join('');
    }

    /**
     * Rehydrates a routine string produced by `compressForCopy` using four-character tokens.
     */
    decompressRoutine(routineString) {
        if (!routineString?.startsWith('#')) {
            throw new Error('Routine string must start with #');
        }

        const normalized = routineString.trim().substring(1);
        const [encoded] = normalized.split('~');

        if (!encoded || encoded === '0000') {
            return [];
        }

        if (encoded.length % 4 !== 0) {
            throw new Error('Invalid routine string length');
        }

        const sectionIds = [];
        for (let i = 0; i < encoded.length; i += 4) {
            const token = encoded.substring(i, i + 4);
            sectionIds.push(this.decode(token));
        }

        return sectionIds;
    }
}

const compressor = new SectionCompressor();
window.compressor = compressor;
