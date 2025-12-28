import type { TravelDataBase } from "./types.js";

export interface MongoDBDocument {
  _id: string;
}

export type MongoTravelData = Omit<TravelDataBase, "id"> & MongoDBDocument;
