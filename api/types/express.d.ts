import { Request } from "express";
import { IUser } from "../models/user.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
