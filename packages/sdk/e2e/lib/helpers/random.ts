import { randomUUID } from "node:crypto";

export const randomEmail = () => {
  return `test+${randomUUID()}-sdk@unidy.de`;
};
