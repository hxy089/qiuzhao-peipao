import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'
import { mdToHtml } from '../utils/md'

interface Props {
  md: string
  highlight: boolean
  className?: string
}

export default function MarkdownView({ md, highlight, className }: Props) {
  const html = useMemo(() => {
    const src = mdToHtml(md, highlight)
    return marked.parse(src, { async: false }) as string
  }, [md, highlight])

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
