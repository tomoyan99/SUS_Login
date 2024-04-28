export function error(self,error) {
    let message ;
    if (typeof error === "object"){
        message = error.stack.toString();
    }else if(typeof error === "string"){
        message = error;
    }
    self.changeInfoLabel("ERROR");
    self.setInfo(message);
}