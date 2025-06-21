// src/lib/search-utils.ts

/**
 * Generates all possible variations of a search term by replacing 'a', 'i', 'u'
 * with their circumflex counterparts 'â', 'î', 'û'.
 *
 * This is useful for Turkish language searches where users often omit the circumflex.
 *
 * @example
 * generateAccentVariations("hala")
 * // Returns: ['hala', 'hâla', 'halâ', 'hâlâ']
 *
 * @example
 * generateAccentVariations("sahil")
 * // Returns: ['sahil', 'sâhil']
 *
 * @param term The input search term.
 * @returns An array of strings containing all possible variations.
 */
export function generateAccentVariations(term: string): string[] {
    const accentMap: Record<string, string> = {
        a: "â",
        i: "î",
        u: "û",
    };

    const replaceableIndices: number[] = [];
    for (let i = 0; i < term.length; i++) {
        const char = term[i].toLowerCase();
        if (char === 'a' || char === 'i' || char === 'u') {
            replaceableIndices.push(i);
        }
    }

    if (replaceableIndices.length === 0) {
        return [term];
    }

    const variations = new Set<string>();
    const numVariations = 1 << replaceableIndices.length; // 2^n variations

    for (let i = 0; i < numVariations; i++) {
        const tempWord = term.split('');
        for (let j = 0; j < replaceableIndices.length; j++) {
            // Check if the j-th bit of the counter 'i' is set
            if ((i >> j) & 1) {
                const charIndex = replaceableIndices[j];
                const originalChar = tempWord[charIndex].toLowerCase();

                if (originalChar in accentMap) {
                    tempWord[charIndex] = accentMap[originalChar];
                }
            }
        }
        variations.add(tempWord.join(''));
    }

    return Array.from(variations);
}
