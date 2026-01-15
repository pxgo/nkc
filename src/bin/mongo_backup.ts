import moment from 'moment';
import PATH from 'path';
import schedule from 'node-schedule';
import yazl from 'yazl';
import fs from 'fs';
import { spawn } from 'child_process';
import { configs } from '@/settings/env';
const fsPromises = fs.promises;

const { folder, time } = configs.backup;
const {
  database: dbName,
  username: dbUsername,
  password: dbPassword,
  address: dbAddress,
  port: dbPort,
} = configs.mongodb;

if (folder && time) {
  schedule.scheduleJob(time, backupDatabase);
  console.log(`MongoDB 备份服务已启动，时间：${time}`);
} else {
  console.error('MongoDB 备份服务启动失败，未配置目标文件夹和备份时间。');
}

export async function backupDatabase(): Promise<void> {
  const now = new Date();
  const folderPath = getDataFolderByDate(now);
  console.log(`${getTimestamp()} 开始备份数据库 ${dbName} ...`);
  let data = '';
  let error = '';

  const command = [
    '--gzip',
    '--host',
    `${dbAddress}:${dbPort}`,
    '--db',
    dbName,
    '--out',
    `${folderPath}`,
  ];

  if (dbUsername && dbPassword) {
    command.push('-u', dbUsername, '-p', dbPassword);
  }

  const day = Number(moment().format('DD'));
  if (day % 4 !== 0) {
    command.push('--excludeCollection', 'logs');
  }
  if (day % 12 !== 0) {
    command.push('--excludeCollection', 'visitorLogs');
  }

  const child = spawn('mongodump', command);

  child.stdout.on('data', (d: Buffer) => {
    const text = d.toString();
    console.log(text);
    data += `${text}\n`;
  });

  child.stderr.on('data', (d: Buffer) => {
    const text = d.toString();
    console.log(text);
    error += `${text}\n`;
  });

  child.on('close', (code: number) => {
    if (code !== 0) {
      console.log(`${getTimestamp()} 备份失败\n${error}`);
      return;
    }

    console.log(`${getTimestamp()} 备份完成 开始压缩...`);
    const zipFilePath = getZipFilePathByDate(now);
    compressedDir(PATH.resolve(folderPath, dbName), zipFilePath)
      .then(() => {
        console.log(`${getTimestamp()} 压缩完成 ${zipFilePath}`);
        removeCacheFolder(folderPath).catch((err: Error) => {
          console.log(
            `${getTimestamp()} 清理缓存目录失败 ${err.message || err}`,
          );
        });
      })
      .catch((err: Error) => {
        console.log(`${getTimestamp()} 压缩失败 ${err.message || err}`);
      });
  });
}

async function addDirectoryToZip(
  zipfile: yazl.ZipFile,
  dirPath: string,
  basePath: string,
): Promise<void> {
  const files = await fsPromises.readdir(dirPath);

  for (const file of files) {
    const filePath = PATH.join(dirPath, file);
    const relativePath = PATH.join(basePath, file);
    const stats = await fsPromises.stat(filePath);

    if (stats.isDirectory()) {
      await addDirectoryToZip(zipfile, filePath, relativePath);
    } else {
      zipfile.addFile(filePath, relativePath);
    }
  }
}

async function compressedDir(
  dirPath: string,
  zipFilePath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const targetDirPath = PATH.dirname(zipFilePath);
        await fsPromises.mkdir(targetDirPath, { recursive: true });

        const zipFile = fs.createWriteStream(zipFilePath);

        zipFile.on('error', (err) => reject(err));
        zipFile.on('finish', () => resolve());

        const zip = new yazl.ZipFile();
        await addDirectoryToZip(zip, dirPath, './');

        zip.outputStream.pipe(zipFile).on('close', () => {
          console.log('ZIP file created');
        });
        zip.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

function getDataFolderByDate(t: Date | string | number): string {
  const m = moment(t);
  const folderPath = PATH.resolve(
    folder,
    `./${dbName}/${m.format('YYYY')}/${m.format('MM')}/${dbName}_${m.format(
      'YYYYMMDD',
    )}_cache`,
  );
  fs.mkdirSync(folderPath, { recursive: true });
  return folderPath;
}

function getZipFilePathByDate(t: Date | string | number): string {
  const folderPath = getDataFolderByDate(t);
  const m = moment(t);
  return PATH.resolve(folderPath, `../${dbName}_${m.format('YYYYMMDD')}.zip`);
}

function getTimestamp(t?: Date): string {
  const m = moment(t || new Date());
  return `${m.format('YYYY-MM-DD HH:mm:ss')} backup`;
}

async function removeCacheFolder(dirPath: string): Promise<void> {
  // Remove the temporary cache directory after successful compression
  await fsPromises.rm(dirPath, { recursive: true, force: true });
  console.log(`${getTimestamp()} 已删除缓存目录 ${dirPath}`);
}
