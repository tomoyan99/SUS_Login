import {description} from "../../description/description.js";
import MainHome from "../../home/MainHome";

export function appInfo(self:MainHome) {
  self.setInfo(description.SUS_LOGIN);
}