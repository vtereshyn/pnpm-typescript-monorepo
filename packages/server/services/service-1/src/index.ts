import * as yup from "yup";
import { requiredIfProductionEnv } from "@vtereshyn/core";

export const configSchema = yup
  .object({
    JOB_ROLES_SERVICE_PORT: requiredIfProductionEnv({ defaultValue: "4018" }),
    JOB_ROLES_ES_INDEX: yup.string().required().default("jobrole_lookup_table"),
  })
  .defined();

export type ConfigType = yup.InferType<typeof configSchema>;

export class Service1 {
  a: number;
  constructor(a: number) {
    this.a = a;
  }
}
