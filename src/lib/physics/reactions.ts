import type { Reaction } from './types';

/** Processes the lab can run once the matching inputs are on the workbench. */
export const reactions: Reaction[] = [
	{
		id: 'neutron-beta-decay',
		name: 'Neutron beta decay',
		inputs: ['n'],
		outputs: ['p', 'e-', 'anti-nu_e'],
		force: 'weak',
		mediator: 'W-',
		description:
			'A down quark inside the neutron emits a virtual W⁻ and turns into an up quark. The W⁻ immediately becomes an electron and an electron antineutrino.'
	},
	{
		id: 'down-to-up',
		name: 'Quark flavour change',
		inputs: ['d'],
		outputs: ['u', 'W-'],
		force: 'weak',
		mediator: 'W-',
		description:
			'The core vertex of beta decay: only the weak force can change a quark into a different flavour.'
	},
	{
		id: 'w-minus-decay',
		name: 'W⁻ decay',
		inputs: ['W-'],
		outputs: ['e-', 'anti-nu_e'],
		force: 'weak',
		description: 'A W⁻ decays into a charged lepton and its matching antineutrino.'
	},
	{
		id: 'muon-decay',
		name: 'Muon decay',
		inputs: ['mu-'],
		outputs: ['e-', 'anti-nu_e', 'nu_mu'],
		force: 'weak',
		mediator: 'W-',
		description:
			'Each lepton family number is conserved separately, so a muon neutrino must appear.'
	},
	{
		id: 'pion-decay',
		name: 'Charged pion decay',
		inputs: ['pi+'],
		outputs: ['mu+', 'nu_mu'],
		force: 'weak',
		mediator: 'W+',
		description: 'The u and d̄ annihilate into a W⁺, which becomes an antimuon and a muon neutrino.'
	},
	{
		id: 'neutral-pion-decay',
		name: 'Neutral pion decay',
		inputs: ['pi0'],
		outputs: ['gamma', 'gamma'],
		force: 'electromagnetic',
		description: 'The quark and antiquark annihilate electromagnetically into two photons.'
	},
	{
		id: 'electron-positron-annihilation',
		name: 'Electron–positron annihilation',
		inputs: ['e-', 'e+'],
		outputs: ['gamma', 'gamma'],
		force: 'electromagnetic',
		description: 'Matter meets antimatter: all of their mass becomes light.'
	},
	{
		id: 'pair-production',
		name: 'Pair production',
		inputs: ['gamma', 'gamma'],
		outputs: ['e-', 'e+'],
		force: 'electromagnetic',
		description: 'Two energetic photons can create an electron and a positron out of pure energy.'
	},
	{
		id: 'higgs-to-photons',
		name: 'Higgs to two photons',
		inputs: ['H'],
		outputs: ['gamma', 'gamma'],
		force: 'higgs',
		description: 'The decay channel used to discover the Higgs boson at the LHC in 2012.'
	},
	{
		id: 'z-to-electrons',
		name: 'Z decay',
		inputs: ['Z'],
		outputs: ['e-', 'e+'],
		force: 'weak',
		description: 'The Z boson can decay into any fermion–antifermion pair lighter than itself.'
	}
];
