import {screenCtrC} from "./built-in/screenCtrC.js";
import {screenEsc} from "./built-in/screenEsc.js";
import {screenTab} from "./built-in/screenTab.js";
import {treeLeft} from "./built-in/treeLeft.js";
import {treeRight} from "./built-in/treeRight.js";
import {treeSelect} from "./built-in/treeSelect.js";
import {treeEntered} from "./built-in/treeEntered.js";
import {euc} from "./original/euc.js";
import {sclass} from "./original/sclass.js";
import {sola} from "./original/sola.js";
import {pageEnter} from "./original/pageEnter.js";
import {pageReturn} from "./original/pageReturn.js";
import {quit} from "./original/quit.js";
import {logs} from "./original/logs.js";
import {images} from "./original/images.js";
import {completion} from "./original/completion.js";
import {error} from "./original/error.js";
import {network} from "./original/network.js";
import {appInfo} from "./original/appInfo.js";
import {pageReload} from "./original/pageReload.js";

export const listeners = {
    "blessed":{
        treeEntered :treeEntered,
        treeSelect  :treeSelect,
        treeRight   :treeRight,
        treeLeft    :treeLeft,
        screenTab   :screenTab,
        screenEsc   :screenEsc,
        screenCtrC  :screenCtrC
    },
    "original" :{
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
        network     :network
    }
}
