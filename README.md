# Deutsch Sprint

大学生德语词汇与语法复习网站模板。

## 当前版本

- 红白主题学习界面
- 今日学习概览
- 大一大二 / 大三大四阶段选择
- 词库资料入口与独立词库数据文件
- 语法资料入口与独立语法库数据文件
- 示例单词卡片
- AI 辅助讲解入口占位
- 朋友个人网页关联入口
- 错词复习与进度面板

## 资料库原则

- 参考 CEFR、Goethe 公开学习范围、DaF 语法体系和国内高校德语课程大纲来搭结构。
- 不复制考试真题、教材词表、机构例句、练习题、音频或讲义。
- 单词释义、例句、讲解、练习题和错题反馈后续全部做原创内容。

## 初版数据

- `data/vocab-library.json`：按大一大二 / 大三大四拆分词汇主题。
- `data/grammar-library.json`：按形态基础 / 句法核心 / 表达提升拆分语法专题。

## 参考来源

- Goethe-Institut 词汇训练与 A1/A2/B1 公开练习材料
- Goethe-Institut CEFR 等级说明
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
