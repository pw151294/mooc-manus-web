---
rule_id: R-43-a11y
severity: medium
---

# UI 可访问性

mooc-manus-web 以 Ant Design 为基底组件库，绝大多数交互形态（Button / Modal / Menu / Form / Tree / Table）自带基础 ARIA 与键盘支持。本规则定位 a11y 基线，约束自定义交互场景与 antd 之外的"半成品组件"，确保符合 WCAG 2.1 AA 关键准则。

## 现状基线

`grep -rn "aria-\|role=" src/` 当前为空——项目所有 a11y 能力来自 antd 内建实现。新增自定义交互（非 antd 组件）必须显式补 ARIA。

## 禁止行为

1. **禁止"裸 div" 充当可交互元素**
   - 禁止 `<div onClick={...}>` 作为按钮/链接；必须用 `<Button>` / `<a>` / `<Menu.Item>` 等语义元素，或显式补 `role="button"` + `tabIndex={0}` + `onKeyDown`（Enter/Space）
   - 禁止 `<span onClick={...}>` 同理
   - antd 的 `<Button type="link">` / `<Button type="text">` 优先于自造

2. **禁止可点击元素无可读文本或 ARIA label**
   - 纯图标按钮必须 `aria-label="<动作描述>"` 或 antd 的 `<Tooltip title="...">`（Tooltip 会自动注入 aria-describedby）
   - `<Button icon={<DeleteOutlined />} />` 无 children → 必须加 `aria-label="删除"`
   - 图片必须 `alt`；装饰性图片 `alt=""`

3. **禁止仅靠颜色传递信息**
   - 表单错误、状态徽标等不得仅用红/绿区分；必须搭配文字 / icon / 形状
   - 颜色对比度按 WCAG AA：正文 ≥ 4.5:1，大字号 ≥ 3:1；antd 默认 token 已满足，自定义主题 token 时需验证

4. **禁止破坏键盘可达性**
   - 不得 `tabIndex={-1}` 让本应可达的控件跳过 Tab 焦点
   - 不得在 `onKeyDown` 里 `preventDefault()` 屏蔽 Tab / Shift+Tab / Enter / Space 的默认行为
   - 不得为视觉效果加 `outline: none` 而不提供等效的 focus visible 样式

5. **禁止 Modal / Drawer 焦点泄漏**
   - 自造 Modal 必须实现：打开时焦点入框（首个可聚焦元素或显式 `autoFocus`）、关闭时焦点回到触发元素、Esc 关闭、Tab 焦点循环
   - 优先用 antd 的 `<Modal>` / `<Drawer>`——已内建 focus trap 与 Esc 处理
   - 项目当前 Modal 全部来自 antd（参考 `src/pages/Skill/ImportProviderModal.tsx` / `SkillDetailModal.tsx`），不要替换为自造组件

## 要求行为

1. **Ant Design 优先**
   - 表单 → `<Form>` + `<Form.Item>`（自动关联 label 与 input）
   - 弹窗 → `<Modal>` / `<Drawer>`
   - 列表选择 → `<Menu>` / `<Tree>` / `<Select>`
   - 表格 → `<Table>`（自带 `role="table"`、`scope` 等语义）
   - 提示 → `<Tooltip>` / `<Popover>`
   - 反馈 → `App.useApp()` 提供的 `message` / `notification`

2. **图标按钮的标注**
   ```tsx
   // 推荐：Tooltip 包裹
   <Tooltip title="删除该技能">
     <Button icon={<DeleteOutlined />} danger />
   </Tooltip>

   // 或：显式 aria-label
   <Button icon={<DeleteOutlined />} aria-label="删除该技能" danger />
   ```

3. **焦点管理**
   - 删除/确认类危险操作 → 用 antd 的 `Modal.confirm`，默认焦点在"取消"上
   - 表单提交后保留焦点在合理位置（错误字段 / 提交按钮 / 下一步）
   - 动态插入列表（如 SSE 流式消息）→ 不要每帧抢焦点；新内容用 `aria-live="polite"` 区域承载

4. **键盘导航**
   - 所有交互必须可用 Tab 到达、Enter/Space 触发
   - 复杂控件（Tree / Tabs / Menu）→ 用 antd 内建键盘支持（方向键、Home/End）
   - 自造下拉/弹层 → 必须实现 Esc 关闭、方向键移动焦点

5. **语义化结构**
   - 页面有且仅有一个 `<h1>`（或视觉等效）
   - `<Layout>` / `<Sider>` / `<Header>` / `<Content>` 来自 antd，已对应 landmark role
   - 表单 label 必须与 input 关联（antd Form.Item 自动处理）

6. **颜色对比与主题**
   - 使用 antd 默认 token，不要为单一组件覆盖低对比色
   - tailwindcss（已安装 v3）自定义颜色时，用 https://webaim.org/resources/contrastchecker/ 验证
   - 暗色主题（如未来引入）需重新校验对比

## Agent 行为

- 检测到 `<div onClick={...}>` 或 `<span onClick={...}>` → 拒绝，改写为 `<Button>` 或补 `role="button"` + `tabIndex={0}` + `onKeyDown`
- 检测到纯图标 `<Button>` 无 children 且无 `aria-label` / 外层 `<Tooltip>` → blocker
- 检测到 `<img>` 缺 `alt` → 要求补充
- 检测到 `outline: none` 不提供 focus-visible 样式 → 拒绝
- 用户要求"自造 Modal" → 引用本规则要求 §禁止5，引导优先用 antd Modal/Drawer
- 用户问"如何做色盲适配" → 引用本规则 §禁止3，要求文字/图标双通道传递

## 可验证性

- 静态检查：
  - `grep -rn "<div[^>]*onClick" src/` 应为空（或所有匹配点同时含 `role="button"` 与 `tabIndex`）
  - `grep -rn "<span[^>]*onClick" src/` 同上
  - `grep -rn "icon={.*}.*Button" src/` 抽查是否伴随 `aria-label` 或 `<Tooltip>`
- 运行时检查（建议引入 axe-core 自动化）：
  - `npm install -D @axe-core/react` + 在开发环境注入，控制台输出 a11y 违例
  - 后续 CI 接入 axe-playwright，阻断关键违例
- 人工验证（不可全自动）：
  - 键盘单测：Tab 走完主流程，无"卡死"或"跳过"
  - 屏幕阅读器：macOS VoiceOver 跑一遍核心页面（Agent 对话 / Skill 列表 / Tool 管理）
  - 颜色对比：自定义 token 走 WebAIM Contrast Checker
- WCAG 全量合规需手动测试 + 专家评审，本规则提供基线护栏而非完整证明
