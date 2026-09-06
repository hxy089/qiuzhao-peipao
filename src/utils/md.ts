/** 简历导出/复制时去掉 == 高亮标记 */
export function stripMarks(md: string): string {
  return md.replace(/==/g, '')
}

/** markdown → html；改动高亮开启时把 ==text== 转为 <mark> */
export function mdToHtml(md: string, highlight: boolean): string {
  const src = highlight ? md.replace(/==([^=\n]+)==/g, '<mark>$1</mark>') : md.replace(/==/g, '')
  return src
}
