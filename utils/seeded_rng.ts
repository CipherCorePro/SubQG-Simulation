// utils/seeded_rng.ts

export class SeededRandom {
  private seed: number;
  // LCG parameters (glibc)
  private m = 0x80000000; // 2^31
  private a = 1103515245;
  private c = 12345;

  constructor(seed: number) {
    this.seed = Math.floor(Math.abs(seed)) % this.m;
    if (this.seed === 0) { // Ensure seed is not zero if m is a power of 2, to avoid getting stuck at 0
        this.seed = 1;
    }
  }

  // Returns a random integer in [0, m-1)
  private nextInt(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed;
  }

  // Returns a random float in [0, 1)
  public nextFloat(): number {
    return this.nextInt() / this.m;
  }

  // Standard Normal variate using Box-Muller transform with the seeded PRNG
  public randn(): number {
    let u = 0, v = 0;
    while (u === 0) u = this.nextFloat(); // Converting [0,1) to (0,1)
    while (v === 0) v = this.nextFloat();
    const val = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return val;
  }
}
