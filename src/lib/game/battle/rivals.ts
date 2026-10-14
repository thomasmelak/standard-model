import type { RankId } from '../ranks';

// Rivals: fixed, themed teams, each teaching one idea, in order of difficulty
// (measured by the balance test: the share of elementary-only teams that win).

export interface Rival {
	id: string;
	name: string;
	team: [string, string, string];
	rank: RankId;
	lesson: string;
}

export const RIVALS: Rival[] = [
	{
		id: 'top',
		name: 'The Top',
		team: ['t', 'b', 'alpha'],
		rank: 'student',
		lesson: 'Heavy quarks hit hard but decay within turns: t → b → c → s → u.'
	},
	{
		id: 'leptons',
		name: 'Charged Leptons',
		team: ['e-', 'mu-', 'tau-'],
		rank: 'student',
		lesson: 'Leptons have no colour: the strong force passes them by.'
	},
	{
		id: 'nuclear',
		name: 'Nuclear Family',
		team: ['p', 'n', 'alpha'],
		rank: 'technician',
		lesson: 'The residual strong force, the neutral neutron and a doubly charged nucleus.'
	},
	{
		id: 'photons',
		name: 'The Photon Club',
		team: ['gamma', 'e+', 'pi0'],
		rank: 'technician',
		lesson: 'Massless particles strike first; matter meets antimatter.'
	},
	{
		id: 'quarks',
		name: 'Quark Gang',
		team: ['u', 'd', 's'],
		rank: 'researcher',
		lesson: 'Quarks feel every force: colour, charge, weak and Higgs.'
	},
	{
		id: 'heavyweights',
		name: 'Heavyweights',
		team: ['W+', 'Z', 'H'],
		rank: 'professor',
		lesson: 'The heaviest bosons decay in one turn, into particles that fight on.'
	}
];
