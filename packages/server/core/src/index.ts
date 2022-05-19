import * as yup from "yup";
import { ValueProvider } from "@nestjs/common";
import * as dotenv from "dotenv";
import callsites from "callsites";
import * as fs from "fs";
import * as path from "path";

enum Environment {
  Local = "local",
  Production = "production",
  Test = "test",
}

export const requiredIfProductionEnv = (options?: { defaultValue: string }) =>
  yup
    .string()
    .defined()
    .default(options?.defaultValue || "default")
    .when("$env", {
      is: (env: string) => env === Environment.Production,
      then: yup
        .string()
        .required(
          ({ path }) =>
            `NODE_ENV is Production- must provide env value or default for field: ${path}`
        ),
    });

export const requiredIfNotTestEnv = (options?: { defaultValue: string }) =>
  yup
    .string()
    .required()
    .when("$env", {
      is: (env: string) => env !== Environment.Test && !options,
      then: yup
        .string()
        .required(
          ({ path }) =>
            `NODE_ENV is Not Test- must provide env value or default for field: ${path}`
        ),
      otherwise: yup.string().default(options?.defaultValue),
    });

export const CONFIG_PROVIDER = "CONFIG_PROVIDER";

export const createConfigProvider = <
  T extends Record<string, unknown>
>(options: {
  configSchema: yup.ObjectSchema<any, Record<string, any>, any, any>;
  dotEnvPath: string;
  config?: T;
}): ValueProvider<T> => {
  const { configSchema, dotEnvPath, config } = options;
  dotenv.config({ path: dotEnvPath });
  return {
    provide: CONFIG_PROVIDER,
    useValue: configSchema.validateSync(
      { ...process.env, ...config },
      { context: { env: process.env.NODE_ENV } }
    ),
  };
};

export enum SOURCE_TYPE_KEYS {
  elastic = "elastic",
  mongo = "mongo",
  redis = "redis",
}

export interface HealthConnectionConfig {
  type: SOURCE_TYPE_KEYS;
  checkExists: (config: any) => boolean;
  generateConnection: (config: any) => any;
}

const healthConnectionsConfigurators: Array<HealthConnectionConfig> = [
  {
    type: SOURCE_TYPE_KEYS.mongo,

    checkExists: (config) =>
      config.MONGO_CONNECTION_STRING &&
      (config.MONGO_DATABASE_NAME || config.MBA_TOOLKIT_DB_NAME),

    generateConnection: (config) => ({
      connectionString: config.MONGO_CONNECTION_STRING,
      dbName: config.MONGO_DATABASE_NAME || config.MBA_TOOLKIT_DB_NAME,
    }),
  },
  {
    type: SOURCE_TYPE_KEYS.elastic,

    checkExists: (config) => config.ES_HOST && config.ES_PORT,

    generateConnection: (config) => {
      const esConfig: any = {
        host: config.ES_HOST,
        port: config.ES_PORT,
      };

      if (config.ES_USERNAME && config.ES_PASSWORD) {
        esConfig.username = config.ES_USERNAME;
        esConfig.password = config.ES_PASSWORD;
      }

      return esConfig;
    },
  },
  {
    type: SOURCE_TYPE_KEYS.redis,

    checkExists: (config) => config.REDIS_HOST && config.REDIS_PORT,

    generateConnection: (config) => ({
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
    }),
  },
];

export const configToDatasourcesHealthCheck = (config: any): Array<any> =>
  healthConnectionsConfigurators
    .map((source) => {
      const { type, checkExists, generateConnection } = source;
      if (!checkExists(config)) {
        return false;
      }
      return { type, source: { connection: generateConnection(config) } };
    })
    .filter((source) => !!source);

export function parseStackTracePackageJson(): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentDir = callsites.default()[1].getFileName()!;
  const split = currentDir.split("/dist/");
  const packageJsonPath = path.resolve(split[0], "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, { encoding: "utf8" }));
}

export function parseCwdPackageJson(): Record<string, string> {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  return JSON.parse(fs.readFileSync(packageJsonPath, { encoding: "utf8" }));
}
