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
import {UIManager} from "../ui/UIManager";
import contrib from "blessed-contrib";

export type BlessedListener = {
    treeEntered: (self: UIManager, tree: contrib.widget.Tree) => void,
    treeSelect: (self: UIManager, tree: contrib.widget.Tree) => void,
    treeRight: (self: UIManager, tree: contrib.widget.Tree) => void,
    treeLeft: (self: UIManager, tree: contrib.widget.Tree) => void,
    screenTab: (self: UIManager) => void,
    screenEsc: (self: UIManager) => void,
    screenCtrC: (self: UIManager) => void,
}
export type OriginalListener = {
    appInfo: (self: UIManager) => void,
    euc: (self: UIManager) => void,
    sclass: (self: UIManager) => void,
    sola: (self: UIManager, node: any) => void,
    pageEnter: (self: UIManager) => void,
    pageReload: (self: UIManager) => void,
    pageReturn: (self: UIManager) => void,
    quit: () => void,
    logs: (self: UIManager) => void,
    images: (self: UIManager) => void,
    completion: (self: UIManager) => void,
    error: (self: UIManager, error: Error | string) => void,
    network: (self: UIManager) => void,
}

export type ListenerList = {
    "blessed": BlessedListener,
    "original": OriginalListener,
}

export const listeners: ListenerList = {
    blessed: {
        treeEntered: treeEntered,
        treeSelect: treeSelect,
        treeRight: treeRight,
        treeLeft: treeLeft,
        screenTab: screenTab,
        screenEsc: screenEsc,
        screenCtrC: screenCtrC,
    },
    original: {
        appInfo: appInfo,
        euc: euc,
        sclass: sclass,
        sola: sola,
        pageEnter: pageEnter,
        pageReload: pageReload,
        pageReturn: pageReturn,
        quit: quit,
        logs: logs,
        images: images,
        completion: completion,
        error: error,
        network: network,
    },
};
