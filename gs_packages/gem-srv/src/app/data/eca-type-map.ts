/**
 * This is a mapping of the project names to their respective ECAType in the Embodied Conversational Agent feature, or ECA.
 * The ECA API requires that an ECAType be passed in order to get a response.
 *
 * If you want a project to have an ECA, it must have a mapping here.
 * See ac-conversation-agent.ts for how this is parsed.
 */

export interface ecaMapping {
  projects: string[];
  ECAType: string;
}

export const ECATYPEMAP = {
  mappings: [
    {
      projects: ['honeybees', 'IntroModel_Bees'],
      ECAType: 'Knowledge_Pollination'
    } as ecaMapping,
    {
      projects: [
        'foodweb_animalinteractions_1_group1',
        'foodweb_animalinteractions_1_group2',
        'foodweb_animalinteractions_1_group3'
      ],
      ECAType: 'Knowledge_FoodJustice'
    } as ecaMapping
  ]
};
