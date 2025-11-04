import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useOthers } from '@liveblocks/react/suspense'
import { useRoom } from '@liveblocks/react'
import { LiveblocksYjsProvider } from '@liveblocks/yjs'
import * as Y from 'yjs'
import { updateSlideYDoc } from '../lib/api/decks'

interface LiveEditorProps {
  slideId: string
  initialYUpdate: unknown
}

export function LiveEditor({ slideId, initialYUpdate }: LiveEditorProps) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const isLocalChangeRef = useRef(false)
  const room = useRoom()
  const others = useOthers()
  const ydocRef = useRef<Y.Doc | null>(null)
  const providerRef = useRef<LiveblocksYjsProvider | null>(null)
  const yTextRef = useRef<Y.Text | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  const onlineLabel = useMemo(() => {
    const count = others.length
    if (count === 0) return 'You are alone'
    if (count === 1) return 'You + 1 online'
    return `You + ${count} online`
  }, [others.length])
  
  const decodeYUpdate = (value: unknown): Uint8Array | null => {
    try {
      if (!value && value !== 0) return null
      if (value instanceof Uint8Array) return value
      if (value instanceof ArrayBuffer) return new Uint8Array(value)
      if (typeof value === 'string') {
        if (value.startsWith('\\x')) {
          // hex string from Postgres bytea
          const hex = value.slice(2)
          const bytes = new Uint8Array(hex.length / 2)
          for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
          }
          return bytes
        }
        // try base64
        try {
          const bin = atob(value)
          const bytes = new Uint8Array(bin.length)
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
          return bytes
        } catch (_) {
          // try JSON array
          try {
            const arr = JSON.parse(value)
            if (Array.isArray(arr)) return new Uint8Array(arr)
          } catch (_) {}
        }
        return null
      }
      if (Array.isArray(value)) return new Uint8Array(value as number[])
      return null
    } catch (_) {
      return null
    }
  }

  // Initialize Y.Doc and Liveblocks Yjs provider
  useEffect(() => {
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc
    const decoded = decodeYUpdate(initialYUpdate)
    if (decoded && decoded.length > 0) {
      try {
        Y.applyUpdate(ydoc, decoded)
      } catch (e) {
        // Likely corrupted/legacy snapshot; skip applying
        console.warn('Skipped invalid initial Y update')
      }
    }

    const provider = new LiveblocksYjsProvider(room as any, ydoc)
    providerRef.current = provider

    const yText = ydoc.getText('content')
    yTextRef.current = yText

    const el = divRef.current
    if (el) {
      el.textContent = yText.toString()
    }

    // Reflect remote updates into DOM, ignore local-origin transactions
    const handleYTextChange = (event: Y.YTextEvent) => {
      if (event.transaction?.origin === 'local') return
      const element = divRef.current
      if (!element) return
      const next = yText.toString()
      if (element.textContent !== next) {
        element.textContent = next
      }
    }
    yText.observe(handleYTextChange)

    // Debounced save: persist full state snapshot to Supabase
    const scheduleSave = () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
      saveTimerRef.current = window.setTimeout(async () => {
        try {
          const update = Y.encodeStateAsUpdate(ydoc)
          await updateSlideYDoc(slideId, update)
        } catch (e) {
          console.error('Failed to save y_doc', e)
        }
      }, 1500)
    }

    const onDocUpdate = () => scheduleSave()
    ydoc.on('update', onDocUpdate)

    provider.connect()

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      ydoc.off('update', onDocUpdate)
      yText.unobserve(handleYTextChange)
      provider.destroy()
      ydoc.destroy()
      yTextRef.current = null
      providerRef.current = null
      ydocRef.current = null
    }
  }, [room, slideId, initialYUpdate])

  const handleInput = useCallback<React.FormEventHandler<HTMLDivElement>>((e) => {
    const ydoc = ydocRef.current
    const yText = yTextRef.current
    if (!ydoc || !yText) return
    const element = e.currentTarget
    const next = element.textContent ?? ''
    const prev = yText.toString()
    if (next === prev) return

    // Compute simple diff for single-range replace
    let start = 0
    const minLen = Math.min(prev.length, next.length)
    while (start < minLen && prev[start] === next[start]) start++

    let endPrev = prev.length - 1
    let endNext = next.length - 1
    while (endPrev >= start && endNext >= start && prev[endPrev] === next[endNext]) {
      endPrev--
      endNext--
    }

    const deleteCount = endPrev - start + 1
    const insertText = next.slice(start, endNext + 1)

    isLocalChangeRef.current = true
    ydoc.transact(() => {
      if (deleteCount > 0) yText.delete(start, deleteCount)
      if (insertText.length > 0) yText.insert(start, insertText)
    }, 'local')
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">{onlineLabel}</span>
      </div>
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        className="prose prose-sm sm:prose max-w-none bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 outline-none min-h-[12rem]"
        onInput={handleInput}
      />
    </div>
  )
}


