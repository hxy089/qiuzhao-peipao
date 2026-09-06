import { Settings } from './types'
import { demoReply } from './demo/demoData'
import { extractJSON } from './utils/json'

export type PromptKind = 'p1' | 'p2' | 'p3' | 'p4'

export interface LLMRequest {
  kind: PromptKind
  system: string
  user: string
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export async function callLLM(req: LLMRequest, settings: Settings): Promise<string> {
  if (settings.demoMode) {
    await sleep(800)
    return demoReply(req.kind)
  }
  if (!settings.apiKey) {
    throw new Error('未配置 API Key：请打开右上角「设置」填写，或保持演示模式')
  }
  const base = (settings.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
  let res: Response
  try {
    res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: 0.4,
      }),
    })
  } catch {
    throw new Error('网络请求失败，请检查 Base URL 与网络连接')
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API 返回 ${res.status}：${text.slice(0, 200)}`)
  }
  const data: unknown = await res.json().catch(() => null)
  const content = (data as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content) {
    throw new Error('API 返回内容为空或格式异常')
  }
  return content
}

/** 调用并解析 JSON；解析失败自动重试 1 次（PRD §9.1） */
export async function callLLMJSON<T>(req: LLMRequest, settings: Settings): Promise<T> {
  let lastErr: unknown = null
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callLLM(req, settings)
    try {
      return extractJSON(raw) as T
    } catch (e) {
      lastErr = e
      if (settings.demoMode) break // 演示数据不会解析失败
    }
  }
  throw new Error(
    `AI 返回的数据解析失败，请重试（${lastErr instanceof Error ? lastErr.message : '格式错误'}）`,
  )
}
