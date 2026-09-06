import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

/** 提取 PDF 纯文本；图片型/扫描件会返回接近空的字符串，由调用方兜底引导粘贴文本。 */
export async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    const lines: string[] = []
    let line = ''
    let lastY: number | null = null
    for (const item of tc.items) {
      if (!('str' in item)) continue
      const str = item.str
      if (!str) continue
      const y = (item.transform as number[] | undefined)?.[5] ?? null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
        lines.push(line.trim())
        line = ''
      }
      line += str
      lastY = y
    }
    if (line.trim()) lines.push(line.trim())
    pages.push(lines.join('\n'))
  }
  await doc.destroy()
  return pages.join('\n\n').trim()
}
