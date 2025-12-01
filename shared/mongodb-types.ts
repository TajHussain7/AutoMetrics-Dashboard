import type { TravelDataBase } from "./types";

export interface MongoDBDocument {
  _id: string;
}

export type MongoTravelData = Omit<TravelDataBase, "id"> & MongoDBDocument;
