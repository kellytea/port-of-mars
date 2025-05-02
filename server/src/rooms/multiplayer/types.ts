import { Client, Room } from "colyseus";
import { MultiGameState } from "./state";
import { User } from "@port-of-mars/server/entity/User";
import { LiteGameType } from "@port-of-mars/shared/lite";
export interface LiteGameOpts {
  users: Array<User>;
  type: MultiGameState;
}
