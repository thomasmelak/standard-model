import type { RankId } from '../ranks';

// Rivals: fixed, themed teams, each teaching one idea. Unlocked by rank.

export interface Rival {
	id: string;
	name: string;
	team: [string, string, string];
	rank: RankId;
	lesson: string;
}

export const RIVALS: Rival[] = [
	{
		id: 'leptons',
		name: 'Lepton Lab Assistant',
		team: ['e-', 'mu-', 'nu_e'],
		rank: 'student',
		lesson: 'Charge, and why neutrinos shrug off almost everything.'
	},
	{
		id: 'photons',
		name: 'The Photon Club',
		team: ['gamma', 'e+', 'pi0'],
		rank: 'student',
		lesson: 'Massless particles are fastest; antimatter annihilates.'
	},
	{
		id: 'quarks',
		name: 'Quark Gang',
		team: ['u', 'd', 's'],
		rank: 'technician',
		lesson: 'Colour and the strong force.'
	},
	{
		id: 'nuclear',
		name: 'Nuclear Pair',
		team: ['p', 'n', 'D'],
		rank: 'technician',
		lesson: 'The residual strong force, and the neutral neutron.'
	},
	{
		id: 'heavyweights',
		name: 'Heavyweights',
		team: ['W+', 'Z', 'H'],
		rank: 'researcher',
		lesson: 'The heaviest bosons live for a single turn.'
	},
	{
		id: 'top',
		name: 'The Top',
		team: ['t', 'b', 'alpha'],
		rank: 'professor',
		lesson: 'The decay cascade, and a doubly charged nucleus.'
	}
];
