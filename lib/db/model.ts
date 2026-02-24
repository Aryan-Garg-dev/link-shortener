import { Collection, ObjectId } from "mongodb";
import { getDB } from "@/lib/db/index";

export interface Link {
  _id?: ObjectId;
  code: string;
  url: string;
  clicks: number;
  createdAt: Date;
}

export async function getLinkModel(): Promise<Collection<Link>> {
  const db = await getDB();
  return db.collection<Link>("links");
}
