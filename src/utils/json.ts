/**
 * 从 LLM 返回的文本中鲁棒地提取 JSON：
 * 剥离代码围栏 → 定位首个 { 或 [ → 括号配平截取 → 解析失败时清理常见瑕疵（尾逗号/中文引号）重试。
 */
export function extractJSON(raw: string): unknown {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()

  const start = s.search(/[{[]/)
  if (start === -1) throw new Error('未找到 JSON 内容')
  s = s.slice(start)

  const open = s[0]
  const close = open === '{' ? '}' : ']'
  let depth = 0
  let end = -1
  let inStr = false
  let esc = false
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') inStr = true
    else if (ch === open) depth++
    else if (ch === close) {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  if (end > 0) s = s.slice(0, end)

  try {
    return JSON.parse(s)
  } catch {
    // 继续走清理重试
  }

  const cleaned = s
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
  return JSON.parse(cleaned)
}
