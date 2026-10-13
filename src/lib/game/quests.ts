import { isDiscovered, type Collection } from './collection';

// Quests: a checklist of goals played out in the Particle Lab (or a puzzle).
// Each one is read straight off the collection, so a quest whose goal was
// reached before quests existed is already complete.

export interface Quest {
	id: string;
	title: string;
	description: string;
	/** Done when any of these composites is discovered… */
	make?: string[];
	/** …or when this reaction has been run. */
	react?: string;
}

export const QUESTS: Quest[] = [
	{
		id: 'make-proton',
		title: 'Make a proton',
		description: 'Combine three quarks whose charges add up to +1.',
		make: ['p']
	},
	{
		id: 'make-neutron',
		title: 'Make a neutron',
		description: 'Three quarks again, this time with no net charge.',
		make: ['n']
	},
	{
		id: 'make-hydrogen',
		title: 'Make a hydrogen atom',
		description: 'A proton holding on to one electron.',
		make: ['H-atom']
	},
	{
		id: 'make-meson',
		title: 'Make a meson',
		description: 'Pair a quark with an antiquark. Tick "Antiparticles" in the lab to find them.',
		make: ['pi+', 'pi-', 'pi0', 'K+']
	},
	{
		id: 'beta-decay',
		title: 'Turn a neutron into a proton',
		description: 'Put a neutron on the workbench on its own and let the weak force act.',
		react: 'neutron-beta-decay'
	},
	{
		id: 'annihilate',
		title: 'Annihilate matter with antimatter',
		description: 'Bring an electron and a positron together.',
		react: 'electron-positron-annihilation'
	},
	{
		id: 'make-strange',
		title: 'Get strange',
		description: 'Build a baryon that contains a strange quark.',
		make: ['Lambda']
	},
	{
		id: 'make-deuteron',
		title: 'Fuse a deuteron',
		description: 'Bind a proton and a neutron with the strong force.',
		make: ['D']
	},
	{
		id: 'make-alpha',
		title: 'Forge an alpha particle',
		description: 'Two protons and two neutrons: the core of helium.',
		make: ['alpha']
	},
	{
		id: 'make-helium',
		title: 'Make a helium atom',
		description: 'Give an alpha particle its two electrons.',
		make: ['He-atom']
	},
	{
		id: 'find-higgs',
		title: 'See the Higgs',
		description: 'Decay a Higgs boson the way the LHC first saw it in 2012.',
		react: 'higgs-to-photons'
	}
];

export function questDone(c: Collection, q: Quest): boolean {
	return Boolean(
		q.make?.some((id) => isDiscovered(c, id)) || (q.react && c.reactions.includes(q.react))
	);
}

/** Quests completed between two versions of the collection. */
export function newQuests(before: Collection, after: Collection): Quest[] {
	return QUESTS.filter((q) => questDone(after, q) && !questDone(before, q));
}
