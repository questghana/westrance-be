import { sign, verify, SignOptions } from "jsonwebtoken";
import { env } from "./env.utils";

export const generateJwt = (payload: object, expiresIn: string | number = '1h') => {
  return sign(payload, env.JWT_SECRET, { expiresIn } as SignOptions);
};

export const verifyJwt = <T = {}>(token: string) => {
  return verify(token, process.env.JWT_SECRET!) as T;
};
