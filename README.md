# Deutsch Sprint

面向大学生的分阶段德语词汇、语法与综合能力学习网站。

## 当前版本

- 红白主题学习界面
- 今日学习与本机掌握度记录
- 大一大二 / 大三大四阶段选择
- 326 个分阶段学习词条
- 117 个语法专题
- 14 个听力、阅读、翻译、写作与知识模块
- 16,000 道分阶段原创练习与 420 篇原创完形、阅读语篇
- 朋友个人网页关联入口
- 错词复习与进度面板

## 资料库原则

- 参考 CEFR、Goethe 公开学习范围、DaF 语法体系和国内高校德语课程大纲来搭结构。
- 不复制考试真题、教材词表、机构例句、练习题、音频或讲义。
- 单词释义、例句、讲解、练习题和错题反馈采用原创整理；未完成人工复核的提升阶段例句不公开展示。
- 练习题库已通过程序结构校验，未逐题完成教师审核的内容只作为日常训练，不标注为官方模拟题。

## 初版数据

- `data/vocab-library.json`：按大一大二 / 大三大四拆分的 326 个词条。
- `data/grammar-library.json`：基础与提升阶段共 117 个专题。
- `data/skills-library.json`：高年级综合能力训练框架与训练节奏。
- `data/questions/manifest.json`：大一大二练习目录；七类题型按需加载，合计 8,000 题。
- `data/questions-advanced/manifest.json`：大三大四练习目录；七类高阶题型按需加载，合计 8,000 题。
- `data/questions/passages.json` 与 `data/questions-advanced/passages.json`：完形和阅读使用的原创语篇。
- `docs/advanced-bank-method.md`：高阶题库的公开参考框架、题量分布和质量状态。

## 参考来源

- Goethe-Institut 词汇训练与 A1/A2/B1 公开练习材料
- Goethe-Institut CEFR 等级说明
- Goethe-Zertifikat C1 官方考试目标与公开训练
- TestDaF 官方数字考试示例任务
- Cornelsen DaF 语法与公开练习主题
- DW Learn German 课程等级结构
- 《大学德语教学指南（2021版）》公开书目信息
- UMOOCs / 中国大学 MOOC 公开德语语法课程页面

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
