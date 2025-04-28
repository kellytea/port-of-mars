import { Client, Room } from "colyseus";
import { MultiGameState } from "./state";
import { User } from "@port-of-mars/server/entity/User";
import { MultiGameType } from "@port-of-mars/shared/multiplayer";
export interface MultiGameOpts {
  users: Array<User>;
  type: MultiGameType;
}
