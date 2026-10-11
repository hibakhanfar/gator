import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.resolve(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  const configString = JSON.stringify(rawConfig);
  fs.writeFileSync(getConfigFilePath(), configString);
}

function validateConfig(rawConfig: any): Config {
  if (
    typeof rawConfig !== "object" ||
    rawConfig === null ||
    typeof rawConfig.db_url !== "string" ||
    (rawConfig.current_user_name !== undefined &&
      typeof rawConfig.current_user_name !== "string")
  ) {
    throw new Error("Invalid config file");
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName: rawConfig.current_user_name,
  };
}

export function readConfig(): Config {
  const configFilePath = getConfigFilePath();
  const configContents = fs.readFileSync(configFilePath, "utf-8");
  const rawConfig = JSON.parse(configContents);

  return validateConfig(rawConfig);
}

export function setUser(cfg: Config, userName: string): void {
  cfg.currentUserName = userName;
  writeConfig(cfg);
}