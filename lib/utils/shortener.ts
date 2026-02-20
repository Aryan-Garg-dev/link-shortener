import { customAlphabet } from "nanoid";

const SAFE_ALPHABET =
  "23456789" +        // no 0, no 1
  "ABCDEFGHJKLMNPQRSTUVWXYZ" + // no I, no O
  "abcdefghijkmnopqrstuvwxyz"; // no l

export const generateCode = (size?: number) => {
  const nanoid = customAlphabet(SAFE_ALPHABET);
  return nanoid(size);
}