/**
 * BASE69 SECTION ID COMPRESSOR & DECRYPTOR
 * ========================================
 *
 * PURPOSE:
 * - Compresses 6-digit section IDs (starting with "17") into 3-character codes
 * - Final output format: #abc123def where each 3-char group = one section ID
 *
 * HOW IT WORKS:
 * 1. All section IDs are 6 digits: 17XXXX (e.g., 171234, 178000)
 * 2. Remove the "17" prefix since it's constant
 * 3. Encode remaining 4 digits (0000-9999) using Base69 custom charset
 * 4. Each section ID becomes exactly 3 characters
 *
 * CHARSET USED (69 characters):
 * - Numbers: 0-9 (positions 0-9)
 * - Lowercase: a-z (positions 10-35)
 * - Uppercase: A-Z (positions 36-61)
 * - Special: +.%@*$! (positions 62-68)
 *
 * CAPACITY:
 * - Base69 with 3 chars: 69³ = 328,509 combinations
 * - Required range: 0000-9999 = 10,000 combinations
 * - Safety margin: 32x more capacity than needed
 *
 * ENCODING FORMULA:
 * - remaining_digits = original_section_id - 170000
 * - char1_index = floor(remaining_digits / 69²)
 * - char2_index = floor((remaining_digits % 69²) / 69)
 * - char3_index = remaining_digits % 69
 * - encoded = charset[char1_index] + charset[char2_index] + charset[char3_index]
 *
 * DECODING FORMULA (for creating decryptor):
 * - char1_index = charset.indexOf(encoded[0])
 * - char2_index = charset.indexOf(encoded[1])
 * - char3_index = charset.indexOf(encoded[2])
 * - remaining_digits = char1_index * 69² + char2_index * 69 + char3_index
 * - original_section_id = "17" + remaining_digits.padStart(4, '0')
 *
 * EXAMPLE:
 * - Input: 176329
 * - Remove "17": 6329
 * - char1_index = floor(6329 / 4761) = 1 → charset[1] = '1'
 * - char2_index = floor((6329 % 4761) / 69) = floor(1568 / 69) = 22 → charset[22] = 'm'
 * - char3_index = 6329 % 69 = 50 → charset[50] = 'O'
 * - Output: "1mO"
 *
 * REVERSE EXAMPLE:
 * - Input: "1mO"
 * - char1_index = charset.indexOf('1') = 1
 * - char2_index = charset.indexOf('m') = 22
 * - char3_index = charset.indexOf('O') = 50
 * - remaining = 1 * 4761 + 22 * 69 + 50 = 4761 + 1518 + 50 = 6329
 * - Output: "17" + "6329" = "176329"
 *
 * SAFETY FEATURES:
 * - Uses only safe ASCII characters (no emojis, no breaking chars)
 * - Always exactly 3 characters per section ID
 * - Reversible encoding/decoding
 * - Works perfectly in all messengers and copy/paste scenarios
 * - Huge safety margin (32x more capacity than needed)
 */

class SectionCompressor {
    constructor() {
        // Base69 charset: 69 ultra-safe characters (using @ instead of comma)
        this.charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+.%@*$!';
        this.base = 69;
        this.base2 = this.base * this.base; // 69² = 4761
    }

    encode(sectionId) {
        const idStr = String(sectionId).trim().replace(/[^\d]/g, '');

        if (idStr.length !== 6 || !idStr.startsWith('17')) {
            console.error('Invalid section ID:', idStr);
            return '000';
        }

        // Remove "17" prefix (0000-9999 range)
        const remaining = parseInt(idStr.substring(2), 10);

        // Convert to exactly 3 characters using base69
        const char1Index = Math.floor(remaining / this.base2);
        const char2Index = Math.floor((remaining % this.base2) / this.base);
        const char3Index = remaining % this.base;

        return this.charset[char1Index] + this.charset[char2Index] + this.charset[char3Index];
    }

    decode(encoded) {
        if (encoded.length !== 3) {
            throw new Error('Encoded string must be exactly 3 characters');
        }

        const index1 = this.charset.indexOf(encoded[0]);
        const index2 = this.charset.indexOf(encoded[1]);
        const index3 = this.charset.indexOf(encoded[2]);

        if (index1 === -1 || index2 === -1 || index3 === -1) {
            throw new Error('Invalid characters in encoded string');
        }

        const remaining = index1 * this.base2 + index2 * this.base + index3;
        return '17' + remaining.toString().padStart(4, '0');
    }

    compressForCopy(sectionIds) {
        const validIds = sectionIds.filter(id => {
            const idStr = String(id).trim().replace(/[^\d]/g, '');
            return idStr.length === 6 && idStr.startsWith('17');
        });

        if (validIds.length === 0) {
            return '#000';
        }

        const encoded = validIds.map(id => this.encode(id));
        return '#' + encoded.join('');
    }

    decompressRoutine(routineString) {
        if (!routineString.startsWith('#')) {
            throw new Error('Routine string must start with #');
        }

        const encoded = routineString.substring(1);

        if (encoded.length % 3 !== 0) {
            throw new Error('Invalid routine string length');
        }

        const sectionIds = [];
        for (let i = 0; i < encoded.length; i += 3) {
            const triplet = encoded.substring(i, i + 3);
            sectionIds.push(this.decode(triplet));
        }

        return sectionIds;
    }
}

const compressor = new SectionCompressor();
window.compressor = compressor;
