/**
 * Generates unique referral codes with customizable options
 */
class UniqueReferralGenerator {
  private usedCodes: Set<string> = new Set();
  
  /**
   * Generate a unique referral code
   * @param options Configuration options for the referral code
   * @returns A unique referral code string
   */
  generate(options: ReferralOptions = {}): string {
    const {
      length = 8,
      prefix = '',
      suffix = '',
      charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // Excluded easily confused chars
      attempts = 100,
      separator = '-'
    } = options;

    let code: string;
    let attempt = 0;

    do {
      if (attempt++ >= attempts) {
        throw new Error(`Failed to generate unique code after ${attempts} attempts`);
      }

      code = this.generateRandomCode(length, charset);
      code = [prefix, code, suffix].filter(Boolean).join(separator);
    } while (this.usedCodes.has(code));

    this.usedCodes.add(code);
    return code;
  }

  /**
   * Generate a random code from the given charset
   * @param length Length of the code to generate
   * @param charset Characters to use in the code
   * @returns Randomly generated code
   */
  private generateRandomCode(length: number, charset: string): string {
    let result = '';
    const charsetLength = charset.length;

    // Use crypto.getRandomValues for better randomness if available
    const randomValues = new Uint32Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
    } else {
      // Fallback for environments without crypto (not cryptographically secure)
      for (let i = 0; i < length; i++) {
        randomValues[i] = Math.random() * 0x100000000 >>> 0;
      }
    }

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charsetLength];
    }

    return result;
  }

  /**
   * Manually add a code to mark it as used
   * @param code The code to add to the used set
   */
  addUsedCode(code: string): void {
    this.usedCodes.add(code);
  }

  /**
   * Check if a code is already used
   * @param code The code to check
   * @returns True if the code has been used
   */
  isCodeUsed(code: string): boolean {
    return this.usedCodes.has(code);
  }

  /**
   * Clear all used codes from memory
   */
  clearUsedCodes(): void {
    this.usedCodes.clear();
  }
}

interface ReferralOptions {
  /** Length of the random part of the code (default: 8) */
  length?: number;
  /** Prefix to add before the random part */
  prefix?: string;
  /** Suffix to add after the random part */
  suffix?: string;
  /** Characters to use in the random part (default: alphanumeric without easily confused chars) */
  charset?: string;
  /** Maximum attempts to generate a unique code (default: 100) */
  attempts?: number;
  /** Separator between prefix/suffix and random part (default: '-') */
  separator?: string;
}

// Example usage:
// const generator = new UniqueReferralGenerator();
// const referralCode = generator.generate({
//   prefix: 'USER',
//   length: 6,
//   separator: '_'
// });
// console.log(referralCode); // e.g. "USER_3X8F2Q"

export default UniqueReferralGenerator;