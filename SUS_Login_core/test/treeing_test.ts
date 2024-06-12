import {EventMap,mainEventMap} from "../src/blessed/commandList/commandList";
import {readJSON} from "../src/utils/myUtils";
import * as path from "node:path";

/**
 * @name treeingEventMap
 * @description EventMapデータをcontrib-tree用に整形する関数
 * */
function treeingEventMap(EM: any, depth: number = 0) {
    const except_keys = ["event", "url", "name", "code"];//
    let EM_treed:any =
        depth === 0
            ? { extended: true, children: {}}//depthが0だったらextended,childrenをまず作成
            : Object.keys(EM).length > 0 ? { children: {} }//depth>0だが子要素があるときはchildrenを作成
            : {};
    for (const EM_key in EM) {
        //EM_keyがexcept_keysに存在するキーの場合は
        if (except_keys.includes(EM_key)) {
            EM_treed[EM_key] = EM[EM_key];
        } else {
            EM_treed.children[EM_key] = treeingEventMap(<EventMap>EM[EM_key], depth + 1,);
        }
    }
    return EM_treed;
}

console.dir(treeingEventMap(mainEventMap),{depth:null})
const links = readJSON("data/info_raw.json");

console.dir(treeingEventMap(links.solaLink),{depth:null})