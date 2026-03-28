import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

function MathText({ text }) {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current || !text) return

    // 將文字中的 $...$ 替換為 KaTeX 渲染
    let html = text
    // 行內公式 $...$
    html = html.replace(/\$(.+?)\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { throwOnError: false })
      } catch {
        return match
      }
    })

    // 換行支援
    html = html.replace(/\n/g, '<br/>')

    ref.current.innerHTML = html
  }, [text])

  return <span ref={ref} />
}

export default MathText
