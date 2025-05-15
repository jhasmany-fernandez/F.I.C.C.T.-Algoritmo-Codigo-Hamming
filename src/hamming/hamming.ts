export function calculateParityBits(m: number): number {
    let r = 1;
    while (Math.pow(2, r) < m + r + 1) {
        r++;
    }
    return r;
}

export function isPowerOfTwo(x: number): boolean {
    return (x & (x - 1)) === 0 && x !== 0;
}

export function encodeHamming(data: number[]): number[] {
    const m = data.length;
    const r = calculateParityBits(m);
    const n = m + r;

    const code: number[] = Array(n).fill(0);
    let dataPos = 0;

    for (let i = 0; i < n; i++) {
        if (!isPowerOfTwo(i + 1)) {
            code[i] = data[dataPos++];
        }
    }

    for (let i = 0; i < r; i++) {
        const parityPos = Math.pow(2, i);
        let parity = 0;

        for (let j = 1; j <= n; j++) {
            if ((j & parityPos) && j !== parityPos) {
                parity ^= code[j - 1];
            }
        }
        code[parityPos - 1] = parity;
    }

    return code;
}

export function detectAndCorrect(code: number[]): [number[] | null, string] {
    const n = code.length;
    let r = 0;
    while (Math.pow(2, r) < n + 1) {
        r++;
    }

    let syndrome = 0;
    for (let i = 0; i < r; i++) {
        const parityPos = Math.pow(2, i);
        let parity = 0;

        for (let j = 1; j <= n; j++) {
            if (j & parityPos) {
                parity ^= code[j - 1];
            }
        }

        if (parity !== 0) {
            syndrome |= parityPos;
        }
    }

    if (syndrome === 0) {
        return [null, "No se detectó ningún error."];
    } else if (syndrome <= n) {
        const correctedCode = [...code];
        correctedCode[syndrome - 1] ^= 1;
        return [correctedCode, `Error detectado en la posición ${syndrome}. Palabra corregida: ${correctedCode.join("")}`];
    } else {
        return [null, "Error detectado, pero no se puede corregir (síndrome inválido)."];
    }
}
