import path from 'path';
import { IConfigs } from '../types/configs';
import { Command } from 'commander';
import fs from 'fs';
import { parse as yamlParse } from 'yaml';
// 配置的node环境变量，默认为生产环境
export const NODE_ENV =
  process.env.NODE_ENV === 'development' ? 'development' : 'production';
// 是否为生产环境
export const isProduction = NODE_ENV === 'production';
// 是否为开发环境
export const isDevelopment = !isProduction;
export const isDev = isDevelopment;
// 当前的进程ID
export const processId = Number(process.pid) || 0;

let configsFilePath = path.resolve(__dirname, `../../configs.${NODE_ENV}.yaml`);

try {
  fs.statSync(configsFilePath);
} catch (err) {
  configsFilePath = path.resolve(__dirname, `../../configs.defaults.yaml`);
}
const configs = yamlParse(
  fs.readFileSync(configsFilePath).toString(),
) as IConfigs;

const program = new Command();
program.allowUnknownOption(true);

// 命令行参数 host, port 优先级最高
program
  .option(
    '--port <number>',
    `Server port(default ${configs.server.port})`,
    configs.server.port.toString(),
  )
  .option(
    '--host <char>',
    `Server host(default ${configs.server.address})`,
    configs.server.address,
  );
program.parse();
const options = program.opts() as {
  host: string;
  port: string;
};

configs.server.address = options.host;
configs.server.port = Number(options.port);

export { configs };

// TODO: 这里再global上挂方法是为了兼容旧代码，待改进
// @ts-ignore
global.throwErr = function (status, message) {
  const error = new Error(message);
  // @ts-ignore
  error.status = status;
  throw error;
};

/* module.exports = {
  NODE_ENV,
  isProduction,
  isDevelopment,
  processId,
}; */
