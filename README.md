# Deutsch Sprint

面向大学生的分阶段德语词汇、语法与综合能力学习网站。

## 当前版本

- 红白主题学习界面
- 词汇、语法和即时自测组成的每日学习任务
- 大一大二 / 大三大四阶段选择
- 5,000 张按阶段、CEFR 与频率组织的 C-I-A 词卡，包含核心义、IPA 重音、可验证构词联想、词形配价和双语例句；其中 326 张为人工整理
- 4,882 个开放 IPA 匹配、888 个开放词典动词变位；无法可靠拆分的词不编造词根故事
- 117 个带例句、自测和迁移练习的语法专题
- 16 个听力、听写、阅读、翻译、写作与知识模块，共 34 节可作答课程
- 四学期学习路线、12 题入门诊断与 170 分钟综合模拟
- 16,000 个分阶段训练题项与 420 篇原创完形、阅读语篇
- 朋友个人网页关联入口
- 间隔复习、分阶段进度、七天活动和本机记录导入导出

## 资料库原则

- 参考 CEFR、Goethe 公开学习范围、DaF 语法体系和国内高校德语课程大纲来搭结构。
- 不复制考试真题、教材词表、机构例句、练习题、音频或讲义。
- 单词释义、例句、讲解、练习题和错题反馈采用原创整理。
- 公版名句单独标注作者与作品，不把文学引文冒充日常例句；个别历史拼写按现行正字法现代化。
- 练习题库已通过程序结构校验，未逐题完成教师审核的内容只作为日常训练，不标注为官方模拟题。

## 初版数据

- `data/vocab-library.json`：按大一大二 / 大三大四拆分的 326 个词条。
- `data/vocab-index.json`：大一大二 2,500 条、大三大四 2,500 条的识记索引。
- `data/grammar-library.json`：基础与提升阶段共 117 个专题。
- `data/skills-library.json`：高年级综合能力训练框架与训练节奏。
- `data/skill-lessons.json`：16 个综合能力模块、34 节原创课程，包含 12 篇听写与 8 个基础写作工坊。
- `data/classic-quotes.json`：公版德语名句、原创中文释义与语言观察。
- `data/questions/manifest.json`：大一大二练习目录；七类题型按需加载，合计 8,000 题。
- `data/questions-advanced/manifest.json`：大三大四练习目录；七类高阶题型按需加载，合计 8,000 题。
- `data/questions/passages.json` 与 `data/questions-advanced/passages.json`：完形和阅读使用的原创语篇。
- `docs/advanced-bank-method.md`：高阶题库的公开参考框架、题量分布和质量状态。

## 本地检查

```text
node tools/validate-site.js
node tools/serve.js 8127
```

第二条命令会在 `http://127.0.0.1:8127/` 启动本地预览。

## 参考来源

- Goethe-Institut 词汇训练与 A1/A2/B1 公开练习材料
- Goethe-Institut CEFR 等级说明
- Goethe-Zertifikat C1 官方考试目标与公开训练
- TestDaF 官方数字考试示例任务
- Cornelsen DaF 语法与公开练习主题
- DW Learn German 课程等级结构
- 《大学德语教学指南（2021版）》公开书目信息
- UMOOCs / 中国大学 MOOC 公开德语语法课程页面
- `german-nouns` / WiktionaryDE 的名词性别、复数和第二格开放数据（CC BY-SA 4.0）
- `open-dict-data/ipa-dict` 的德语 IPA 数据（德语数据为 CC BY-SA）
- `german-verbs-dict` / LanguageTool `german-pos-dict` 的动词变位数据（CC BY-SA 4.0）

## GitHub Pages 部署

1. 新建一个 GitHub 仓库，推荐命名为 `deutsch-sprint`。
2. 上传本文件夹中的 `index.html`、`styles.css`、`script.js`、`.nojekyll` 和 `README.md`。
3. 打开仓库的 `Settings`。
4. 进入 `Pages`。
5. Source 选择 `Deploy from a branch`。
6. Branch 选择 `main`，文件夹选择 `/root`。
7. 保存后等待 1-2 分钟。

部署完成后，网站地址通常是：

```text
https://你的用户名.github.io/deutsch-sprint/
```

如果仓库名是 `你的用户名.github.io`，网站地址会是：

```text
https://你的用户名.github.io/
```
