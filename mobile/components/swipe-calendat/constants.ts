import { Dimensions } from "react-native";

export const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
export const MONTH_SHORT = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
export const DAY_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
export const DAY_FULL  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const { width: SW } = Dimensions.get("window");
export const SCREEN_W = SW;
export const H_PAD  = 20;
export const CELL_W = Math.floor((SW - H_PAD * 2) / 7);
export const CELL_H = CELL_W;

export const WEEK_H         = 20 + CELL_H + 8;
export const MONTH_BODY_H   = 20 + CELL_H * 6 + 8;
export const EXPANDED_TOTAL = MONTH_BODY_H + 48;

export const V_THRESHOLD = 36;
export const H_THRESHOLD = 40;