import {screenCtrC} from "./built-in/screenCtrC";
import {screenEsc} from "./built-in/screenEsc";
import {screenTab} from "./built-in/screenTab";
import {treeLeft} from "./built-in/treeLeft";
import {treeRight} from "./built-in/treeRight";
import {treeSelect} from "./built-in/treeSelect";
import {treeEntered} from "./built-in/treeEntered";
import {euc} from "./original/euc";
import {sclass} from "./original/sclass";
import {sola} from "./original/sola";
import {pageEnter} from "./original/pageEnter";
import {pageReturn} from "./original/pageReturn";
import {quit} from "./original/quit";
import {logs} from "./original/logs";
import {images} from "./original/images";
import {completion} from "./original/completion";
import {error} from "./original/error";
import {network} from "./original/network";
import {appInfo} from "./original/appInfo";
import {pageReload} from "./original/pageReload";
import MainHome from "../home/MainHome";
import contrib from "blessed-contrib";

export type BlessedListener = {
  treeEntered:(self:MainHome,tree:contrib.widget.Tree)=>void,
  treeSelect :(self:MainHome,tree:contrib.widget.Tree)=>void,
  treeRight  :(self:MainHome,tree:contrib.widget.Tree)=>void,
  treeLeft   :(self:MainHome,tree:contrib.widget.Tree)=>void,
  screenTab  :(self:MainHome)=>void,
  screenEsc  :(self:MainHome)=>void,
  screenCtrC :(self:MainHome)=>void,
}
export type OriginalListener = {
  appInfo    :(self:MainHome)=>void,
  euc        :(self:MainHome)=>void,
  sclass     :(self:MainHome)=>void,
  sola       :(self:MainHome,node:any)=>void,
  pageEnter  :(self:MainHome)=>void,
  pageReload :(self:MainHome)=>void,
  pageReturn :(self:MainHome)=>void,
  quit       :()=>void,
  logs       :(self:MainHome)=>void,
  images     :(self:MainHome)=>void,
  completion :(self:MainHome)=>void,
  error      :(self:MainHome,error: Error | string)=>void,
  network    :(self:MainHome)=>void,
}

export type ListenerList = {
  "blessed":BlessedListener,
  "original":OriginalListener,
}

export const listeners:ListenerList = {
  blessed: {
    treeEntered :treeEntered,
    treeSelect  :treeSelect,
    treeRight   :treeRight,
    treeLeft    :treeLeft,
    screenTab   :screenTab,
    screenEsc   :screenEsc,
    screenCtrC  :screenCtrC,
  },
  original: {
    appInfo     :appInfo,
    euc         :euc,
    sclass      :sclass,
    sola        :sola,
    pageEnter   :pageEnter,
    pageReload  :pageReload,
    pageReturn  :pageReturn,
    quit        :quit,
    logs        :logs,
    images      :images,
    completion  :completion,
    error       :error,
    network     :network,
  },
};
