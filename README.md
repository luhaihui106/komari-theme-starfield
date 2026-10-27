# 星空（Starfield）

**给 Komari 监控面板换上星空背景和 3D 地球，让服务器状态更直观。**

这是在开源主题基础上继续修改的访客主题，不是从零开发，也不是 Komari 官方主题。只改变前台展示，不包含监控后端或独立管理后台。

## 引用了哪些上游？

本项目的代码来自以下开源主题，保留原作者的版权与许可：

- [sanrokamlan-prog / Glassmorphism](https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism)：毛玻璃主题来源之一。
- [towersip / Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism)：另一份 Glassmorphism 派生代码来源。
- [Tokinx / Emerald](https://github.com/Tokinx/komari-theme-emerald)：3D 地球相关代码来源。

**简单说：保留毛玻璃界面和地球展示的基础，再围绕星空外观、地球效果、城市信息和使用细节做改进。** 上游已有的功能不算本项目原创。

## 增加了什么？

- **星空外观**：默认银河背景、地球网页图标，也可以换成自己的背景图片或视频。
- **更丰富的地球效果**：接入 NASA 地球贴图，补充晨昏光照、大气、国界和节点连线效果。
- **城市汇总与交互**：用简短城市代码和台数标出节点位置，点击城市可看汇总上下行、机器名称和在线状态；机器多时可以滚动查看。

## 改了什么？

- **标签更清楚**：城市标签保持小巧，亮暗模式下的详情面板不再被底层文字干扰。
- **手机也能看**：保留卡片、列表与响应式布局，城市详情支持触屏选择。
- **背景加载更省**：压缩默认银河图片；等待设置或自定义背景时，不再提前重复下载默认图。自定义图片或视频加载失败，会回退到默认背景。
- **系统更好认**：补充本地系统图标；没有合适图标的系统显示文字标识，未知系统使用通用图标。
- **细节补齐**：补充城市缩写，整理图片、图标和代码的来源说明，并加入回归测试。

## 亮点是什么？

### 1. 功能：分布、状态和网络质量，集中查看

地球上看节点分布，点击城市查看同城机器、在线状态和汇总上下行；配合节点卡片、列表，以及移动／联通／电信的延迟和丢包展示，既能看整体，也能查单台。默认每 3 秒更新。

### 2. UI 与体验：星空地球更有辨识度，信息也更好读

银河背景搭配 NASA 地球贴图、晨昏光照和节点连线，保留毛玻璃界面；城市标签小巧，国旗和系统标识便于辨认。亮暗模式下详情文字清楚，手机支持触屏查看；背景按需加载，加载失败有默认图兜底。

城市展示需要后端提供相应定位数据；数据不足时会显示国家代码，不会凭空生成城市。

## 效果预览

以下使用虚构演示数据，不是真实监控节点。手机图为 Chromium 视口模拟，并非实机 Safari 测试。

![桌面演示](docs/screenshots/desktop.png)
![手机演示](docs/screenshots/mobile.png)

## 怎么安装？

1. 打开 [Releases 下载页](https://github.com/luhaihui106/komari-theme-starfield/releases)，下载 `komari-theme-Starfield-build-*.zip`，并核对 `SHA256SUMS`。
2. 进入 Komari 后台的主题管理，上传 ZIP。
3. 选择并应用 **Starfield（星空）**。

**不要上传 GitHub 自动生成的 `Source code.zip`。** 更新前保留旧主题包和设置；从 GlassEmerald 切换时，需要手动选择新主题并配置，不会自动迁移设置。

历史版本已在官方 Komari 1.5.1 上完成真实上传与应用验证；不保证所有后端版本。当前 v0.1.12 主要修复背景加载、压缩背景图片、补充系统图标和城市缩写，没有重新进行完整后端兼容测试。详见 [安装与兼容说明](docs/compatibility.md) 和 [更新记录](CHANGELOG.md)。

## 素材来源与许可

- **主题代码**：保留上述上游与本项目的 MIT 版权文本。
- **银河背景**：EvgeniT 的 CC0 摄影作品，本项目做了压缩处理，不是本项目拍摄。
- **地球贴图**：来自 NASA，不是本项目原创，也不表示 NASA 认可或赞助。
- **地理数据、国旗和系统图标**：分别使用 Natural Earth、Twemoji、Simple Icons 等来源，按各自许可使用；并非所有素材都适用 MIT。

完整说明见 [第三方许可](THIRD_PARTY_NOTICES.md)、[素材来源](ASSET_PROVENANCE.md)、[NASA 贴图](NASA_TEXTURE.md)、[补充素材说明](CANDIDATE_NOTICES.md) 和 [LICENSE](LICENSE)。品牌与商标归各自权利人所有。

## 开发与更多说明

需要 Node.js `^20.19.0` 或 `>=22.12.0`，使用 Bun `1.3.14`。

```sh
bun install --frozen-lockfile
bun run lint
bun run type-check
bun test ./test/*.test.ts
bunx vitest run test/runtime
bun run security:public
bun run build
bunx playwright install chromium
bun run test:visual
```

- [v0.1.12 详细维护与验证记录](docs/maintenance-v0.1.12.md)
- [安装、旧版设置与兼容范围](docs/compatibility.md)
- [隐私说明](PRIVACY.md)：访客位置、第三方定位请求和审计需要由管理员评估；隐藏按钮不等于后端授权。

构建使用 `SOURCE_DATE_EPOCH` 实现可重复打包，资源目录包含源提交短 hash。开发 API 目标可通过 `VITE_API_TARGET` 指定，默认仅本机。演示与测试使用虚构数据，不包含生产节点或私人设置；不要提交真实 `.env`、Cookie 或 Token。
