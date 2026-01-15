const fs = require('fs');
const path = require('path');
const { sync } = require('glob');

// 加载并解析 tsconfig.json，获取 outDir 和路径别名
const tsconfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, './tsconfig.json'), 'utf8'),
);
const { outDir, paths } = tsconfig.compilerOptions;

// 提取别名配置 (当前只处理 "@/*": ["./src/*"])
const aliasKey = Object.keys(paths)[0].replace('/*', '');

// 编译输出目录 (dist)
const distTarget = path.resolve(__dirname, outDir);

console.log(`🚀 开始处理别名替换: ${aliasKey} -> ${distTarget}`);

// 查找 dist 目录下所有的 JS 文件
const files = sync(`${distTarget}/**/*.js`);

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileDir = path.dirname(filePath);
  let hasChanged = false;

  // 只匹配使用别名的 require("@/...") 调用
  const regex = new RegExp(
    `(require\\(['"])${aliasKey}/([^'"]+)(['"]\\))`,
    'g',
  );

  const newContent = content.replace(
    regex,
    (match, prefix, suffix, suffixEnd) => {
      // 计算目标绝对路径
      const fullTargetPath = path.resolve(distTarget, suffix);
      // 计算当前文件到目标的相对路径
      let relativePath = path
        .relative(fileDir, fullTargetPath)
        .replace(/\\/g, '/');

      // 格式化路径：确保以 ./ 开头
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }

      hasChanged = true;
      console.log(
        `  [替换] ${filePath}: ${aliasKey}/${suffix} -> ${relativePath}`,
      );
      return `${prefix}${relativePath}${suffixEnd}`;
    },
  );

  if (hasChanged) {
    fs.writeFileSync(filePath, newContent);
  }
});

console.log('✅ 别名替换完成！');
