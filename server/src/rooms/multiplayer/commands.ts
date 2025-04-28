import _ from "lodash";
import { Command } from "@colyseus/command";
import { User } from "@port-of-mars/server/entity";
import { MultiGameRoom } from "@port-of-mars/server/rooms/multiplayer";
import { getServices } from "@port-of-mars/server/services";
import { getRandomIntInclusive } from "@port-of-mars/server/util";
import { EventCard, Player, TreatmentParams } from "./state";
import { MultiGameStatus } from "@port-of-mars/shared/multiplayer";

abstract class Cmd<Payload> extends Command<MultiGameRoom, Payload> {
  get defaultParams() {
    return this.state.defaultParams;
  }
}
abstract class CmdWithoutPayload extends Cmd<Record<string, never>> {}

export class InitGameCmd extends Cmd<{ users: Array<User> }> {
  execute({ users } = this.payload) {
    return [
      new SetPlayerCmd().setPayload({ users }),
      new CreateDeckCmd(),
      new SetTreatmentParamsCmd().setPayload({ users }),
      new SetGameParamsCmd(),
      new PersistGameCmd(),
      new SetFirstRoundCmd(),
      new BroadcastReadyCmd(),
    ];
  }
}

export class SetPlayerCmd extends Cmd<{ users: User[] }> {
  execute({ users } = this.payload) {
    users.map(user => {
      this.state.players.push(
        new Player({
          userId: user.id,
          username: user.username,
          points: 0,
        })
      );
    });

    // shuffle roles and randomly assign to players in game state
    const shuffledRoles = _.shuffle(this.state.availableRoles);
    this.state.players.slice(0, 3).forEach((player, index) => {
      this.state.roles.set(shuffledRoles[index], player.username);
    });
  }
}

export class CreateDeckCmd extends CmdWithoutPayload {
  async execute() {
    const { multiplayer: service } = getServices();
    const cards = (await service.drawEventCardDeck(this.state.type)).map(
      data => new EventCard(data)
    );
    if (this.state.type === "prolificVariable") {
      // prolific configuration uses a fixed deck
      this.state.eventCardDeck.push(...cards);
    } else {
      const shuffledCards = _.shuffle(cards);
      this.state.eventCardDeck.push(...shuffledCards);
    }
  }
}

export class SetTreatmentParamsCmd extends Cmd<{ user: User }> {
  async execute({ user } = this.payload) {
    if (this.state.type === "prolific") {
      const { multiplayer: service } = getServices();
      this.state.treatmentParams = new TreatmentParams(
        await service.getUserNextFreeplayTreatment(user.id)
      );
    } else {
      const { study: service } = getServices();
      this.state.treatmentParams = new TreatmentParams(
        await service.getTreatmentForUser(user, this.state.type)
      );
    }
  }
}

export class SetGameParamsCmd extends CmdWithoutPayload {
  execute() {
    const defaults = this.defaultParams;
    this.state.maxRound = getRandomIntInclusive(defaults.maxRound.min, defaults.maxRound.max);
    this.state.twoEventsThreshold = getRandomIntInclusive(
      defaults.twoEventsThreshold.min,
      defaults.twoEventsThreshold.max
    );
    // this formula may need tweaking
    const threeEventsThresholdMax = Math.min(
      defaults.threeEventsThreshold.max,
      this.state.twoEventsThreshold - 3
    );
    this.state.threeEventsThreshold = getRandomIntInclusive(
      defaults.threeEventsThreshold.min,
      threeEventsThresholdMax
    );
    this.state.updateVisibleCards();
  }
}

export class PersistGameCmd extends CmdWithoutPayload {
  async execute() {
    const { multiplayer, study } = getServices();
    const game = await multiplayer.createGame(this.state);

    if (this.state.type === "prolificVariable" || this.state.type === "prolificBaseline") {
      await study.setProlificParticipantPlayer(this.state.type, game.players);
    }
    this.state.gameId = game.id;
    // keep track of deck card db ids after persisting the deck
    this.state.eventCardDeck.forEach((card, index) => {
      card.deckCardId = game.deck.cards[index].id;
    });
  }
}

export class SetFirstRoundCmd extends CmdWithoutPayload {
  execute() {
    const defaults = this.defaultParams;
    this.state.round = 1;
    this.state.systemHealth = defaults.startingSystemHealth;
    this.state.timeRemaining = defaults.timeRemaining;
    this.state.players.forEach(player => {
      player.resources = defaults.resources;
    });
    this.state.updateRoundInitialValues();
    this.state.isRoundTransitioning = false;
    this.state.canInvest = true;

    return [new SendHiddenParamsCmd()];
  }
}

export class BroadcastReadyCmd extends CmdWithoutPayload {
  execute() {
    this.room.broadcast("ready", { kind: "ready" });
  }
}

export class SendHiddenParamsCmd extends CmdWithoutPayload {
  execute() {
    const data: any = {};
    if (this.state.treatmentParams.isEventDeckKnown) {
      data.eventCardDeck = this.state.eventCardDeck.map(card => card.toJSON());
    }
    if (this.state.treatmentParams.isNumberOfRoundsKnown) {
      data.maxRound = this.state.maxRound;
    }
    if (this.state.treatmentParams.thresholdInformation === "known") {
      data.twoEventsThreshold = this.state.twoEventsThreshold;
      data.threeEventsThreshold = this.state.threeEventsThreshold;
    } else if (this.state.treatmentParams.thresholdInformation === "range") {
      data.twoEventsThresholdRange =
        this.defaultParams.twoEventsThresholdDisplayRange || this.defaultParams.twoEventsThreshold;
      data.threeEventsThresholdRange =
        this.defaultParams.threeEventsThresholdDisplayRange ||
        this.defaultParams.threeEventsThreshold;
    }
    this.room.clients.forEach(client => {
      client.send("set-hidden-params", {
        kind: "set-hidden-params",
        data,
      });
    });
  }
}

export class ApplyCardCmd extends Cmd<{ playerSkipped: boolean }> {
  validate() {
    return (
      this.state.activeCardId >= 0 &&
      this.state.status === "incomplete" &&
      this.state.systemHealth > 0
    );
  }

  async execute({ playerSkipped } = this.payload) {
    if (!this.state.activeCard) return;

    if (playerSkipped) {
      this.room.eventTimeout?.clear();
    }

    this.state.players.forEach(player => {
      if (this.state.activeCard) {
        if (player.points < -this.state.activeCard.pointsEffect) {
          player.points = 0; // prevent overflow
        } else {
          player.points += this.state.activeCard.pointsEffect;
        }

        if (player.resources < -this.state.activeCard.resourcesEffect) {
          player.resources = 0;
        } else {
          player.resources += this.state.activeCard.resourcesEffect;
        }
      }
    });

    // system health shouldn't go above the max or below 0
    this.state.systemHealth = Math.max(
      0,
      Math.min(
        this.defaultParams.systemHealthMax,
        this.state.systemHealth + this.state.activeCard.systemHealthEffect
      )
    );

    this.state.activeCard.expired = true; // expire the card
    this.state.updateVisibleCards();

    if (this.state.systemHealth <= 0) {
      this.state.players.forEach(player => {
        (player.pendingInvestment = 0), (player.pointsEarned = 0);
      });
      return [new PersistRoundCmd(), new EndGameCmd().setPayload({ status: "defeat" })];
    }

    // if we still have cards left, prepare the next one
    const nextRoundCard = this.state.nextRoundCard;
    if (nextRoundCard) {
      this.state.activeCardId = nextRoundCard.deckCardId;
      return new StartEventTimerCmd();
    } else {
      this.state.canInvest = true;
      this.state.activeCardId = -1;
    }
  }
}

export class StartEventTimerCmd extends CmdWithoutPayload {
  execute() {
    this.room.eventTimeout = this.clock.setTimeout(() => {
      this.room.dispatcher.dispatch(new ApplyCardCmd().setPayload({ playerSkipped: true }));
    }, this.defaultParams.eventTimeout * 1000);
  }
}

export class DrawCardsCmd extends CmdWithoutPayload {
  execute() {
    let drawCount = this.getDrawCount();
    this.drawRoundCards(drawCount);
    // draw 2 more if murphy's law is in play
    if (this.state.roundEventCards.some(card => card.isMurphysLaw)) {
      drawCount += 2;
      this.drawRoundCards(2);
    }
    this.state.timeRemaining += this.defaultParams.eventTimeout * drawCount;
    const nextRoundCard = this.state.nextRoundCard;
    if (nextRoundCard) {
      this.state.activeCardId = nextRoundCard.deckCardId;
    } else {
      this.state.activeCardId = -1;
    }
    this.state.updateVisibleCards();
    return new StartEventTimerCmd();
  }

  drawRoundCards(count: number) {
    let drawn = 0;
    for (const card of this.state.upcomingEventCards) {
      if (drawn === count) {
        break;
      }
      card.inPlay = true;
      drawn++;
    }
  }

  getDrawCount() {
    if (this.state.systemHealth >= this.state.twoEventsThreshold) return 1;
    if (this.state.systemHealth >= this.state.threeEventsThreshold) return 2;
    return 3;
  }
}

export class PlayerInvestCmd extends Cmd<{
  systemHealthInvestment: number;
  clockRanOut?: boolean;
  player: Player;
}> {
  validate({ systemHealthInvestment, player } = this.payload) {
    return this.state.canInvest && systemHealthInvestment <= player.resources;
  }
  async execute({ systemHealthInvestment, clockRanOut, player } = this.payload) {
    let surplus = 0;
    if (!clockRanOut) {
      surplus = player.resources - systemHealthInvestment;
    }
    const index = this.state.players.findIndex(p => p.username == player.username);
    this.state.players[index].points += surplus;
    this.state.players[index].pendingInvestment = systemHealthInvestment;
    this.state.players[index].pointsEarned = surplus;
  }
}

export class ProcessRoundCmd extends CmdWithoutPayload {
  async execute() {
    let totalSystemHealthInvestment = 0;
    this.state.players.forEach(player => {
      if (player.pendingInvestment != null) {
        totalSystemHealthInvestment += player.pendingInvestment;
      }
    });
    this.state.systemHealth = Math.min(
      this.defaultParams.systemHealthMax,
      this.state.systemHealth + totalSystemHealthInvestment
    );

    // wait a bit for the round transition so we can see the investment before deducting wear+tear
    this.state.timeRemaining = this.defaultParams.roundTransitionDuration;
    this.state.isRoundTransitioning = true;
    this.state.canInvest = false;
    await new Promise(resolve =>
      setTimeout(resolve, this.defaultParams.roundTransitionDuration * 1000)
    );
    this.state.systemHealth = Math.max(
      0,
      this.state.systemHealth - this.defaultParams.systemHealthWear
    );

    if (this.state.systemHealth <= 0) {
      return [new PersistRoundCmd(), new EndGameCmd().setPayload({ status: "defeat" })];
    }
    return [new PersistRoundCmd(), new SetNextRoundCmd()];
  }
}

export class PersistRoundCmd extends CmdWithoutPayload {
  async execute() {
    const { multiplayer: service } = getServices();
    //FIXME: change how round gets saved in the db
    await service.createRound(this.state, systemHealthInvestment, pointsInvestment);
  }
}

export class SetNextRoundCmd extends CmdWithoutPayload {
  async execute() {
    this.state.canInvest = false; // disable investment until all cards are applied
    this.state.isRoundTransitioning = false;

    const defaults = this.defaultParams;

    if (this.state.round + 1 > this.state.maxRound) {
      return new EndGameCmd().setPayload({ status: "victory" });
    }

    this.state.round += 1;
    this.state.updateRoundInitialValues();

    this.state.players.forEach(player => {
      player.resources = defaults.resources;
    });

    this.state.timeRemaining = defaults.timeRemaining;

    this.state.eventCardDeck.forEach(card => {
      card.inPlay = false;
    });
    this.state.updateVisibleCards();
    if (this.state.upcomingEventCards.length > 0) {
      return new DrawCardsCmd();
    } else {
      this.state.canInvest = true;
      this.state.activeCardId = -1;
    }
  }
}

export class EndGameCmd extends Cmd<{ status: MultiGameStatus }> {
  async execute({ status } = this.payload) {
    this.clock.clear();
    // wait for a few seconds so the client can see the final state
    await new Promise(resolve => setTimeout(resolve, 3000));

    this.state.status = status;
    const { multiplayer: service } = getServices();
    await service.updateGameStatus(this.state.gameId, status);
    await Promise.all(
      this.state.players.map(player => {
        service.updatePlayerPoints(
          this.state.gameId,
          player.points,
          this.state.maxRound,
          this.state.status
        );
      })
    );

    // wait for the update to be sent to the client
    await new Promise(resolve => setTimeout(resolve, 5000));
    this.room.disconnect();
  }
}
