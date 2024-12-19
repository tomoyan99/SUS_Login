import {TreeEventMap} from "../../main/setup";

export const mainEventMap:Record<string,TreeEventMap> =
{
  SUS_LOGIN: {
    event: "appinfo",
    "{#00ff4c-fg}EUC{/}": {
      event: "euc",
    },
    SCLASS: {
      event: "sclass",
    },
    SOLA: {
      event: "sola",
      "{#0077ff-fg}PAGE_LIST{/}": { event: "page" },
      "{#fcd303-fg}PAGE_RELOAD{/}": { event: "pagereload" },
    },
    // "履修仮組みツール":{"event":"completion"}
  },
  LOG: { event: "log" },
  IMAGE: { event: "image" },
  "{red-fg}QUIT{/}": { event: "quit" },
};