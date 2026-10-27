# 安装、兼容与验证范围

## 适用范围

Starfield 是 Komari 的访客前端主题，不包含后端或独立管理后台，也不是只能用于 Komari Slim。`/admin`、`/terminal` 由官方后端内置前端提供，不由主题替换。

历史版本曾在隔离环境中，向未修改的官方 Komari 1.5.1（linux-arm64）真实上传并应用主题。官方发布二进制 SHA256：`21eca252151c3099a093c02130f6750ae6b860cf78cf8e4b50fc002c7007552f`。

当时验证了 `/api/public`、`/api/nodes`、`/api/version`、主题设置写入和公开读取、内置 `/admin` 可达，以及桌面和 Chromium 模拟手机的亮暗资源解码、默认星空 hash、国家级标签和离线节点详情；没有拦截或 mock 后端 API。测试使用虚构节点，关闭地球自动旋转后进行点击测试。未验证真实在线 agent 上报、物理手机或 Safari，不保证所有后端版本。

v0.1.12 是主题维护版本，未重新进行完整的后端上传认证、管理员操作或实机测试。该版本的具体验证见 [维护来源说明](maintenance-v0.1.12.md)，不能把历史兼容证据理解为每个新版本都已完成相同验证。

源码包含 Komari 1.2.6 Metric Store 接口及旧 records 回退，但没有对该旧版本做真实后端认证。高级工具、访客 IP 城市定位、审计和远程管理等能力，需要对应后端接口、数据及权限，不列为已验证功能。没有定位数据时，标签回退到国家代码，不会凭空生成城市。

## 安装注意事项

- 使用 Release 中的 `komari-theme-Starfield-build-*.zip`，核对同一 Release 的 `SHA256SUMS`。
- ZIP 根目录包含 `komari-theme.json`、`dist/` 和许可证。不要上传 GitHub 自动生成的 `Source code.zip`。
- 支持通过主题管理上传；远程导入可使用该 ZIP 的公开下载地址。
- 上传会替换同名主题，操作前请保留原主题包与设置。

## 旧版名称与设置

自 v0.1.7 起使用“星空（Starfield）”名称，内部 `name/short` 为 `Starfield`。它是独立安装的主题，不覆盖 GlassEmerald，也不会自动迁移其后端设置；需要手动选择并配置。

旧 v0.1.6 标签和发行附件保留原字节。地球 renderer 的 `emerald` 值和浏览器位置缓存键 `glass-emerald-globe-position-v1` 仅为兼容实现标识，不代表设置迁移。
