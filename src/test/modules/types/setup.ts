export type MainData = {
  userdata: User;
  solaLink: SolaLinkData;
  last_upd: LastUpdateData;
};
export type User = {
  username: string;
  password: string;
};
export type EventName =
  | "appinfo"
  | "euc"
  | "sclass"
  | "sola"
  | "page"
  | "pagereload"
  | "log"
  | "image"
  | "quit"
  | string;
export type TreeEventMap = {
  event?: EventName;
  [key: string]: TreeEventMap | string | undefined;
};
export type SolaClassRecord = TreeEventMap & {
  name: string;
  view_name?: string;
  event: "sola";
  code: string;
  url: string;
};
export type SolaLinkData = Record<"前期" | "後期" | string, SolaClassRecord[] | TreeEventMap>;

export type LastUpdateData = {
  year: number;
  month: number;
  date: number;
  value: number;
  term: "bf" | "af";
};
