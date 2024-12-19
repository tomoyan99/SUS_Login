import MainHome from "../../home/MainHome";

export function error(self:MainHome, error:Error|string) {
  let message:string="";
  if (typeof error === "object") {
    message = error.stack?.toString()??error.message;
  } else {
    message = error;
  }
  self.changeInfoLabel("ERROR");
  self.setInfo(message);
}