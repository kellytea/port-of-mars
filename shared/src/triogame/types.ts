export interface EventCard {
  codeName: string;
  displayName: string;
  flavorText: string;
  effect: string;
  rollMin: number;
  rollMax: number;
  systemHealthMultiplier: number;
  pointsMultiplier: number;
  resourcesMultiplier: number;
  vote: boolean;
  role?: string;
  duration?: number;
}
export interface EventCardData {
  deckCardId?: number;
  expired?: boolean;
  inPlay?: boolean;
  codeName: string;
  displayName: string;
  flavorText: string;
  effectText: string;
  pointsEffect: number;
  resourcesEffect: number;
  systemHealthEffect: number;
  vote: boolean;
  role?: string;
  duration?: number;
}

export type ThresholdInformation = "unknown" | "range" | "known";
export interface TreatmentData {
  id: string; // saachi's treatmentIndex col in TrioGame.ts
  treatmentName: string;
  description: string;
  cards: Array<EventCard>;
}

export type TrioGameType = "prolific";

export type TrioGameStatus = "incomplete" | "victory" | "defeat";

// FIXME: need to adjust after finalizing event cards/treatment
export interface TrioGameParams {
  maxRound: { min: number; max: number };
  roundTransitionDuration: number;
  twoEventsThreshold: { min: number; max: number };
  threeEventsThreshold: { min: number; max: number };
  twoEventsThresholdDisplayRange?: { min: number; max: number };
  threeEventsThresholdDisplayRange?: { min: number; max: number };
  systemHealthMax: number;
  systemHealthWear: number;
  startingSystemHealth: number;
  timeRemaining: number;
  eventTimeout: number;
  points: number;
  resources: number;
}

export interface TrioGameClientState {
  type: TrioGameType;
  status: TrioGameStatus;
  timeRemaining: number;
  systemHealth: number;
  twoEventsThreshold?: number;
  threeEventsThreshold?: number;
  twoEventsThresholdRange?: { min: number; max: number };
  threeEventsThresholdRange?: { min: number; max: number };
  maxRound?: number;
  round: number;
  treatmentParams: {
    isNumberOfRoundsKnown: boolean;
    isEventDeckKnown: boolean;
    thresholdInformation: "unknown" | "range" | "known";
    isLowResSystemHealth: boolean;
  };
  player: {
    resources: number;
    points: number;
  };
  visibleEventCards: Array<EventCardData>;
  activeCardId: number;
  canInvest: boolean;
  isRoundTransitioning: boolean;
}
