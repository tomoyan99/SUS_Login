export function error(e) {
    let message ;
    if (typeof e === "object"){
        message = e.stack.toString();
    }else if(typeof e === "string"){
        message = e;
    }
    self.setInfo(message);
    l.blessed.screenTab();
}