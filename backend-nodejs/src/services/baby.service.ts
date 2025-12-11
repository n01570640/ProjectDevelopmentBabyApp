import { CreateBabyDTO, BabyDTO } from "../dtos/baby.dto";
import { createBaby, findBabyById } from "../models/baby.model";

// Business logic wrapper around models
export async function addBaby(data: CreateBabyDTO): Promise<BabyDTO> {
  return await createBaby(data);
}

export async function getBaby(baby_id: number) {
  return await findBabyById(baby_id);
}
