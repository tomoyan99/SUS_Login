"use strict";

import {readFileSync} from "fs";

export function importJSON(path=""){
    return JSON.parse(readFileSync(path,"utf8"));
}