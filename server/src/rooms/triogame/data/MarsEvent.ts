import _ from "lodash";
import { EventCard, TreatmentData, TrioGameType } from "@port-of-mars/shared/triogame/types";
import { getLogger } from "@port-of-mars/server/settings";

const logger = getLogger(__filename);

const _availableEvents: Array<EventCard> = [
  {
    codeName: "lifeAsUsual",
    displayName: "Life As Usual",
    flavorText: 'As the first human outpost on Mars, having a "usual" day is pretty unusual.',
    effect: "No special effect.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "murphysLaw",
    displayName: "Murphy's Law",
    flavorText: 'Residents at Port of Mars know better than to ask, "what ELSE could go wrong?"',
    effect: "Reveal 2 more events for this round.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "politicianOutOfCommission",
    displayName: "Politician Out of Commission",
    flavorText:
      "The mental and physical health of all residents is critical to mission success. The absence of even one person can have rippling effects on the community.",
    effect: "The Politician receives only 3 resources this round.",
    rollMin: 7,
    rollMax: 7,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: -1,
    vote: false,
    role: "Politician",
  },
  {
    codeName: "entrepreneurOutOfCommission",
    displayName: "Entrepreneur Out of Commission",
    flavorText:
      "The mental and physical health of all residents is critical to mission success. The absence of even one person can have rippling effects on the community.",
    effect: "The Entrepreneur receives only 3 resources this round.",
    rollMin: 7,
    rollMax: 7,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: -1,
    vote: false,
    role: "Entrepreneur",
  },
  {
    codeName: "researcherOutOfCommission",
    displayName: "Researcher Out of Commission",
    flavorText:
      "The mental and physical health of all residents is critical to mission success. The absence of even one person can have rippling effects on the community.",
    effect: "The Researcher receives only 3 resources this round.",
    rollMin: 7,
    rollMax: 7,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: -1,
    vote: false,
    role: "Researcher",
  },
  {
    codeName: "lostTime",
    displayName: "Lost Time",
    flavorText: "Time flies when you’re trying to stay alive.",
    effect: "Each player had {roll} fewer resources to spend this round.",
    rollMin: 1,
    rollMax: 5,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 1,
    vote: false,
  },
  {
    codeName: "personalGain",
    displayName: "Personal Gain",
    flavorText: "It’s easy to take risks when others are incurring the costs.",
    effect:
      "Each player secretly chooses Yes or No. Then, simultaneously, players reveal their choice. Players who chose yes gain 6 extra resources this round, but destroy 6 System Health.",
    rollMin: 6,
    rollMax: 6,
    systemHealthMultiplier: -1,
    pointsMultiplier: 0,
    resourcesMultiplier: 1,
    vote: true,
  },
  {
    codeName: "breakdownOfTrust",
    displayName: "Breakdown of Trust",
    flavorText: "Setbacks are inevitable, but no less painful each time.",
    effect: "Each player loses 4 points.",
    rollMin: 4,
    rollMax: 4,
    systemHealthMultiplier: 0,
    pointsMultiplier: -1,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "bondingThroughAdversity",
    displayName: "Bonding Through Adversity",
    flavorText: "Challenges bring communities together.",
    effect: "Each player gains two points",
    rollMin: 2,
    rollMax: 2,
    systemHealthMultiplier: 0,
    pointsMultiplier: 1,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "compulsivePhilanthropy",
    displayName: "Compulsive Philanthropy",
    flavorText: "There’s nothing quite like being volun-told for the greater good.",
    effect:
      "Players must vote one player to put all their resources into System Health this round.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: true,
  },
  {
    codeName: "heroOrPariah",
    displayName: "Hero or Pariah",
    flavorText:
      "In a community as small as Port of Mars, some individuals always stand out--for better or worse.",
    effect:
      "CHOOSE ONE: Players must vote for 1 player to lose 5 Points OR Players must vote or 1 player to gain 5 Points",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: true,
  },
  {
    codeName: "auditEvent",
    displayName: "Audit Event",
    flavorText:
      "Of course, we trust everyone to be truthful. But it doesn’t hurt to check now and again.",
    effect: "For the next round, players can see how each other player allocated their time.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "grantFunk",
    displayName: "Grand Funk",
    flavorText:
      "Your latest failure to gain research funding sees you in bed for a week. It’s not moping, it’s mourning. (And time to draft up new proposals.)",
    effect:
      "You have to decide to accept or not the following offer: Gain 3 points for yourselves, but destroy 4 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Researcher",
    vote: true,
  },
  {
    codeName: "cuttingCorners",
    displayName: "Cutting Corners",
    flavorText:
      "Surely these slightly sub-standard building materials won’t cause that big a problem – and look at the profits!",
    effect:
      "You have to decide to accept or not the following offer: Gain 3 points for yourselves, but destroy 4 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Entrepreneur",
    vote: true,
  },
  {
    codeName: "shortTermGoals",
    displayName: "Short-Term Gains",
    flavorText:
      "You made some outlandish promises to specific groups to win the election. Easy! Now you have to find funding to fulfill those promises…less easy.",
    effect:
      "You have to decide to accept or not the following offer: Gain 3 points for yourselves, but destroy 4 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Politician",
    vote: true,
  },
  {
    codeName: "mutantCrops",
    displayName: "Mutant Crops",
    flavorText:
      "Your attempt to improve food production processes may wipe out an entire crop. Pro: You may get incredible data! Con: You may all starve to death.",
    effect:
      "You have to decide to accept or not the following offer: Gain 6 points for yourselves, but destroy 8 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Researcher",
    vote: true,
  },
  {
    codeName: "insiderTrading",
    displayName: "Insider Trading",
    flavorText:
      "You can make an opportunistic move to sell a huge chunk of your ownership in Port of Mars stock, making a pretty penny but causing a panic in the market.",
    effect:
      "You have to decide to accept or not the following offer: Gain 6 points for yourselves, but destroy 8 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Entrepreneur",
    vote: true,
  },
  {
    codeName: "bribes",
    displayName: "Bribes",
    flavorText:
      "Special interest groups approach you to craft legislation that favors their autonomy. They’re a powerful voting bloc… but is it worth the costs?",
    effect:
      "You have to decide to accept or not the following offer: Gain 6 points for yourselves, but destroy 8 System Health.",
    rollMin: 0,
    rollMax: 0,
    systemHealthMultiplier: 0,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    role: "Politician",
    vote: true,
  },
  {
    codeName: "cropFailure",
    displayName: "Crop Failure",
    flavorText:
      "The good news is we’re not eating any more potatoes this cycle! The bad news is we’re not sure what we’re eating.",
    effect: "Destory 20 System Health",
    rollMin: 20,
    rollMax: 20,
    systemHealthMultiplier: -1,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "hullBreach",
    displayName: "Hull Breach",
    flavorText:
      "Accidents happen. It’s unavoidable. Our job is to do our best to avoid them all the same.",
    effect: "Destroy {roll} System Health",
    rollMin: 1,
    rollMax: 7,
    systemHealthMultiplier: -1,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "solarFlare",
    displayName: "Solar Flare",
    flavorText:
      "Solar flares pose a far greater threat on Mars, where a thin atmosphere and non-existent magnetic field leaves settlers more vulnerable.",
    effect: "Destroy 5 System Health",
    rollMin: 5,
    rollMax: 5,
    systemHealthMultiplier: -1,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
  },
  {
    codeName: "sandstorm",
    displayName: "Sandstorm",
    flavorText: "Buckle in – things are about to get rough. And coarse. And irritating.",
    effect:
      "For the next 3 rounds, destroy an additional 10 System Health at the start of the round.",
    rollMin: 10,
    rollMax: 10,
    systemHealthMultiplier: -1,
    pointsMultiplier: 0,
    resourcesMultiplier: 0,
    vote: false,
    duration: 3,
  },
];

const _deckSets: Record<TrioGameType, Array<TreatmentData>> = {
  prolific: [
    {
      id: "0",
      treatmentName: "lessLAU",
      description: "Distributes 6 'Life As Usual' cards.",
      cards: [..._availableEvents.slice(1), ...cloneCards("lifeAsUsual", 6)],
    },
    {
      id: "1",
      treatmentName: "moderateLAU",
      description: "Distributes 12 'Life As Usual' cards.",
      cards: [..._availableEvents.slice(1), ...cloneCards("lifeAsUsual", 12)],
    },
    {
      id: "2",
      treatmentName: "highLAU",
      description: "Distributes 18 'Life As Usual' cards.",
      cards: [..._availableEvents.slice(1), ...cloneCards("lifeAsUsual", 18)],
    },
  ],
};

export function cloneCards(codeName: string, copies: number): Array<EventCard> {
  const card = _.find(_availableEvents, (e: EventCard) => e.codeName === codeName);
  if (card) {
    return Array.from({ length: copies }, () => ({ ...card }));
  } else {
    logger.warn("Unable to find event card with codeName %s", codeName);
    return [];
  }
}

export function getMarsEvents(gameType: TrioGameType, treatmentId: string): Array<EventCard> {
  const deck = _.find(_deckSets[gameType], (t: TreatmentData) => t.id === treatmentId);
  if (deck) {
    return deck.cards;
  } else {
    logger.warn("No treatment ID found in deck setL %s", treatmentId);
    throw new Error(`No treatment ID found in deck set: ${treatmentId}`);
  }
}
