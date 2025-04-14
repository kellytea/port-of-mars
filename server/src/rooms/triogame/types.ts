import { Client, Room } from "colyseus";
import { TrioGameState } from "./state";
import { User } from "@port-of-mars/server/entity/User";
import { TrioGameType } from "@port-of-mars/shared/triogame";
export interface TrioGameOpts {
  users: Array<User>;
  type: TrioGameType;
}
