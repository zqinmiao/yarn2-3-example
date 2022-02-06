# Yarn 2.x/3.x 使用

[与 js-coding-rover/docs/yarn 相呼应](https://github.com/zqinmiao/js-coding-rover/docs/yarn)

[JavaScript 包管理器简史](https://github.com/zqinmiao/js-coding-rover/docs/yarn/javascript-package-manager-history/index.md)

[yarn1 升级到 v2/v3](./docs/v1-update-v2-v3.md)

[vscode 与 yarn3](./docs/vscode.md)

## 执行`yarn`

> 如果没有`yarn.lock`，直接执行`yarn` 则会提示：

### 一种情况

```bash
$ yarn

 YN0070: Migrating from Yarn 1; automatically enabling the compatibility node-modules linker 👍

Usage Error: The project in /Users/mark/package.json doesn't seem to have been installed - running an install there might help

$ yarn install [--json] [--immutable] [--immutable-cache] [--check-cache] [--inline-builds] [--mode #0]
```

### 另一种情况

```bash
$ yarn
Usage Error: The nearest package directory (/xxx/yarn2-example) doesn't seem to be part of the project declared in /xxx.

- If the project directory is right, it might be that you forgot to list /xxx/yarn2-example as a workspace.
- If it isn't, it's likely because you have a yarn.lock or package.json file there, confusing the project root detection.
```

### 需要[`yarn init`](https://yarnpkg.com/cli/init)一下

```bash
$ yarn init -w
{
  name: 'yarn2-example',
  packageManager: 'yarn@3.0.0',
  private: true,
  workspaces: [
    'packages/*'
  ]
}
```

#### `yarn init -w`后，只生成了`package.json`，而未生成`yarn.lock`

这时需要你在项目根目录下手动创建`yarn.lock`后，再执行`yarn`:

```bash
$ yarn
➤ YN0000: ┌ Resolution step
➤ YN0000: └ Completed
➤ YN0000: ┌ Fetch step
➤ YN0000: └ Completed
➤ YN0000: ┌ Link step
➤ YN0000: └ Completed
➤ YN0000: Done in 0s 215ms
```

这时会生成`.yarn`文件夹

```bash
.yarn
├── cache
├── install-state.gz
```

## 管理各自项目中的 yarn 版本

执行`yarn set version latest`，在`.yarn`文件夹下生成`releases`文件夹

```bash
.yarn
├── cache
├── install-state.gz
└── releases
    └── yarn-3.1.1.cjs
```

## 设置`Zero-Installs`模式下的 yarn 的`.gitigonre`

```yaml
# yarn

.yarn/*
!.yarn/cache
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions
```

## 为什么没有生成`.pnp.cjs`

3.x 版本，默认是`node-modules`模式。开启 pnp 模式，需要创建`.yarnrc.yml`文件

```bash
nodeLinker: "pnp"
```

再执行`yarn`，即可生成`.pnp.cjs`

## [plugins](https://yarnpkg.com/features/plugins)

### [workspace-tools](https://github.com/yarnpkg/berry/tree/master/packages/plugin-workspace-tools)

安装

```bash
$ yarn plugin import workspace-tools
```

- [yarn workspace focus](https://yarnpkg.com/cli/workspaces/focus)
- [yarn workspaces foreach](https://yarnpkg.com/cli/workspaces/foreach)

## 无法访问`node_modules`

> [ZipFS - a zip file system](https://marketplace.visualstudio.com/items?itemName=arcanis.vscode-zipfs)：借助这个 VSCode 插件可以直接打开缓存目录中的`.zip`文件，查看包的源码

在开发过程中我们有时会直接修改 `node_modules` 目录下的依赖来调试。但在 PnP 模式下，由于依赖都指向了缓存文件，我们不再可以直接访问这些依赖。

针对这种场景，`Yarn` 提供了 `yarn unplug packageName` 来将某个指定依赖拷贝到项目中的 `.yarn/unplugged` 目录下。之后 `.pnp.js` 中的 resolver 就会自动加载这个 unplug 的版本。

执行`yarn unplug lodash -A`后，package.json 增加如下配置：

```json
{
  "dependenciesMeta": {
    "lodash@4.17.21": {
      "unplugged": true
    }
  }
}
```

### 移除本地 `.yarn/unplugged` 中的对应依赖

将`unplugged`设为 false，重新执行`yarn`:

```json
{
  "dependenciesMeta": {
    "lodash@4.17.21": {
      "unplugged": false
    }
  }
}
```

## 忘记依赖（幻影依赖（Phantom dependencies））

> 开启 pnp 模式（`nodeLinker: pnp`），无论是否为严格模式，则会解决幻影依赖的问题。
>
> 如果使用yarn@3.1.0及以上版本，甚至可以直接设置`nodeLinker: pnpm`，使用 pnpm 风格的链接器。([pnpm 关于解决幻影依赖的实践](https://github.com/zqinmiao/pnpm-example/blob/master/docs/phantom-dependencies.md))

### 以下为存在`幻影依赖`的情况及之前的解决方法（废弃 ⚠️）

由于将`node_modules`提升到了根目录，我在根目录安装了`eslint`:

```json
{
  "dependencies": {
    "eslint": "^7.32.0"
  }
}
```

在`package-c`中的`index.js`中这样使用：

```js
const eslint = require("eslint");

console.log("eslint", eslint.CLIEngine.version);
```

上面结果会正常运行，但是由于`package-c`的`package.json`中忘记了安装`eslint`，所以就会导致依赖的缺失

```json
// package-c/package.json
{
  "dependencies": {
    "package-b": "1.0.0"
  }
}
```

那么针对这种情况，可以借助`[depcheck](https://github.com/depcheck/depcheck)`来进行检查

## [Editor SDKs](https://next.yarnpkg.com/getting-started/editor-sdks)

由于 yarn2 的`Zero-Installs`特性，vscode 的扩展找不到`node_modules`，所以如`prettier`、`eslint`的自动格式化功能就无效了。

需要执行`yarn dlx @yarnpkg/sdks vscode`

## pnp 模式下使用 webpack

当在 pnp 模式下使用 webpack 时，由于没有`node_modules`文件夹，所以会报解析文件的错误：

```bash
Module not found: Error: Can't resolve 'react-refresh/runtime'
```

需要安装一个 webpack plugin [`pnp-webpack-plugin`](https://github.com/arcanis/pnp-webpack-plugin)

```bash
$ yarn add -D pnp-webpack-plugin
```

```js
const PnpWebpackPlugin = require(`pnp-webpack-plugin`);

module.exports = {
  resolve: {
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
};
```

## pnp 严格模式（pnpMode: strict）

[PnP loose mode](https://yarnpkg.com/features/pnp#pnp-loose-mode)

pnp 模式是严格模式，如果开启了严格模式，我们在启动工程，或者执行如 webpack 等工具时会出现以下报错：

```bash
but it isn't declared in its dependencies; this makes the require call ambiguous and unsound.
```

这是因为`pnp`的严格模式导致的。现在依然有好多 npm 包并未严格遵循规范，我们可以采取`loose`模式。

### packageExtensions

如果不采用`loose`模式。那么我们可以在`.yarnrc.yml`，通过`packageExtensions`对缺少依赖的包进行扩展缺少的依赖，如下：

```yml
packageExtensions:
  postcss-loader@4.x:
    dependencies:
      postcss-preset-env: "6.x"
  styled-components@5.x:
    dependencies:
      react-is: "16.x"
```

## yarn2.x 与 lerna 结合（不推荐）

[yarn-workspaces-vs-lerna](https://yarnpkg.com/features/workspaces#yarn-workspaces-vs-lerna)

### 使用`yarn`代替`npx lerna bootstrap`

#### Unknown Syntax Error: Unsupported option name ("--mutex").

执行`npx lerna bootstrap`,报错（`lerna add module-1 --scope=module-2`也同样有此问题）

```bash
lerna notice cli v4.0.0
lerna info versioning independent
lerna info bootstrap root only
Unknown Syntax Error: Unsupported option name ("--mutex").

$ yarn install [--json] [--immutable] [--immutable-cache] [--check-cache] [--inline-builds] [--mode #0]
lerna ERR! yarn install --mutex network:42424 --non-interactive exited 1 in 'yarn2-example'
lerna ERR! yarn install --mutex network:42424 --non-interactive exited 1 in 'yarn2-example'
```

#### 不能使用`--hoist`

```bash
$ npx lerna bootstrap --hoist
lerna notice cli v4.0.0
lerna info versioning independent
lerna ERR! EWORKSPACES --hoist is not supported with --npm-client=yarn, use yarn workspaces instead
lerna ERR! EWORKSPACES A guide is available at https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/
```

### Lerna does not support yarn 2 workspace:\* url type

如果依赖使用的是`workspace:`协议：

```bash
{
  "dependencies": {
    "@buibis/package-a": "workspace:packages/package-a",
  },
}
```

lerna 不支持 yarn2 的`workspace:* url type`这种形式，执行 lerna 相关命令会报错：

```bash
➜  yarn2-example git:(master) npx lerna version --no-push
lerna notice cli v4.0.0
lerna info versioning independent
lerna ERR! Error: Unsupported URL Type "workspace:": workspace:*
```

[相关 issue](https://github.com/lerna/lerna/issues/2564)

有人已经提了 PR，在分支[test/workspace-protocol](https://github.com/lerna/lerna/tree/test/workspace-protocol)

#### 那么在使用 yarn 的 workspace，给 a 包装 b 包时，如果不想使用 workspace 协议，应当指定版本号

```
$ yarn workspace package-b add package-a@^1.0.2
```

## eslint

eslint 不生效的原因

[[Feature] Extracted config files](https://github.com/yarnpkg/berry/issues/2509)

- 确保相关 plugin 和 parser 已安装
- `extends: ['eslint-v7']` 这种形式会不生效，要使用`extends: [require.resolve('eslint-v7')]`
- 时常 reload vscode
