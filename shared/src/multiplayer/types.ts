// FIXME: remove this if multi event cards are being saved into the db
// export interface EventCard {
//   id: number;
//   codeName: string;
//   displayName: string;
//   flavorText: string;
//   effect: string;
//   drawMin: number;
//   drawMax: number;
//   rollMin: number;
//   rollMax: number;
//   systemHealthMultiplier: number;
//   pointsMultiplier: number;
//   resourcesMultiplier: number;
//   vote?: EventVoteType;
//   role?: string;
//   duration?: number;
// }

export interface EventCardData {
  id: number;
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
  vote?: EventVoteType;
  role?: string;
  duration?: number;
}

export type ThresholdInformation = "unknown" | "range" | "known";

//FIXME: treatment stuff needs to be refactored
export interface TreatmentData {
  id: string;
  treatmentName: string;
  description: string;
  cards: Array<EventCardData>;
}

export type MultiGameType = "multiProlificBaseline" | "multiProlificInterative";

export type MultiGameStatus = "incomplete" | "victory" | "defeat";

export type EventVoteType = "YES_OR_NO" | "VOTE_PLAYER";

export interface MultiGameParams {
  maxRound: { min: number; max: number };
  roundTransitionDuration: number;
  twoEventsThreshold: { min: number; max: number };
  threeEventsThreshold: { min: number; max: number };
  twoEventsThresholdDisplayRange?: { min: number; max: number };
  threeEventsThresholdDisplayRange?: { min: number; max: number };
  numPlayers: number;
  systemHealthMax: number;
  systemHealthWear: number;
  startingSystemHealth: number;
  timeRemaining: number;
  eventTimeout: number;
  points: number;
  resources: number;
}

export interface MultiClientState {
  type: MultiGameType;
  status: MultiGameStatus;
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
