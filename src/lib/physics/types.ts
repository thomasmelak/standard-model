/** The four interactions a particle can take part in (gravity is outside the Standard Model). */
export type Force = 'strong' | 'electromagnetic' | 'weak' | 'higgs';

export type FermionKind = 'quark' | 'lepton';
export type Category = FermionKind | 'gauge-boson' | 'scalar-boson' | 'hadron' | 'nucleus' | 'atom';

/**
 * Additive quantum numbers. Electric charge and baryon number are stored in
 * thirds so that everything stays an integer (a quark carries charge ±1/3 or
 * ±2/3 and baryon number 1/3).
 */
export interface QuantumNumbers {
	/** Electric charge × 3 (an electron is -3). */
	charge3: number;
	/** Baryon number × 3 (a quark is 1, a proton is 3). */
	baryon3: number;
	/** Lepton family numbers. */
	leptonE: number;
	leptonMu: number;
	leptonTau: number;
}

interface BaseParticle extends QuantumNumbers {
	id: string;
	name: string;
	symbol: string;
	category: Category;
	/** Rest mass in MeV/c². */
	massMeV: number;
	/** Spin in units of ħ. */
	spin: number;
	description: string;
}

/** A particle with no known internal structure. */
export interface ElementaryParticle extends BaseParticle {
	elementary: true;
	category: FermionKind | 'gauge-boson' | 'scalar-boson';
	generation?: 1 | 2 | 3;
	/** Forces this particle feels. */
	forces: Force[];
	/** For gauge bosons: the force they carry. */
	mediates?: Force;
	antiparticleId: string;
}

/** A bound state built from other particles (hadrons, nuclei, atoms). */
export interface CompositeParticle extends BaseParticle {
	elementary: false;
	category: 'hadron' | 'nucleus' | 'atom';
	/** Ids of the constituents, which may themselves be composite. */
	constituents: string[];
	/** The interaction responsible for holding the constituents together. */
	boundBy: Force;
}

export type Particle = ElementaryParticle | CompositeParticle;

/** A process turning one set of particles into another, e.g. a decay or annihilation. */
export interface Reaction {
	id: string;
	name: string;
	inputs: string[];
	outputs: string[];
	/** The interaction driving this process. */
	force: Force;
	/** The force carrier exchanged, if any. */
	mediator?: string;
	description: string;
}
