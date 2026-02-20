import { ObjectId } from "mongodb";
import { db } from "@/lib/db/index";

export interface Link {
  _id?: ObjectId;
  code: string;
  url: string;
  clicks: number;
}

export const LinkModel = db.collection<Link>("links");
