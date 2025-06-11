"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, placeholder = "", minHeight = "150px" }: RichTextEditorProps) {
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (editorRef && value !== editorRef.innerHTML) {
      editorRef.innerHTML = value
      setIsEmpty(!value || value.trim() === "")
    }
  }, [value, editorRef])

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef) {
      const content = editorRef.innerHTML
      onChange(content)
      editorRef.focus()
      setIsEmpty(!content || content.trim() === "")
    }
  }

  const handleEditorChange = () => {
    if (editorRef) {
      const content = editorRef.innerHTML
      onChange(content)
      setIsEmpty(!content || content.trim() === "" || content === "<br>")
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
    handleEditorChange()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Manejar shortcuts de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          handleFormat("bold")
          break
        case "i":
          e.preventDefault()
          handleFormat("italic")
          break
        case "u":
          e.preventDefault()
          handleFormat("underline")
          break
      }
    }
  }

  return (
    <div className="border rounded-md overflow-hidden bg-white">
      <div className="bg-gray-50 border-b p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("bold")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Negrita (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("italic")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Cursiva (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("underline")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Subrayado (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("formatBlock", "<h2>")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Título"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("formatBlock", "<h3>")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Subtítulo"
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              handleFormat("insertUnorderedList")
              // Forzar actualización
              setTimeout(() => {
                if (editorRef) {
                  const content = editorRef.innerHTML
                  onChange(content)
                  setIsEmpty(!content || content.trim() === "" || content === "<br>")
                }
              }, 10)
            }
          }}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Lista con viñetas"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
              handleFormat("insertOrderedList")
              // Forzar actualización
              setTimeout(() => {
                if (editorRef) {
                  const content = editorRef.innerHTML
                  onChange(content)
                  setIsEmpty(!content || content.trim() === "" || content === "<br>")
                }
              }, 10)
            }
          }}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("justifyLeft")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Alinear a la izquierda"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("justifyCenter")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Centrar"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => handleFormat("justifyRight")}
          className="h-8 w-8 p-0 hover:bg-gray-200"
          title="Alinear a la derecha"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="relative">
        <div
          ref={(ref) => setEditorRef(ref)}
          contentEditable
          dir="ltr"
          className="p-3 focus:outline-none text-left"
          style={{
            minHeight,
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "normal",
          }}
          onInput={handleEditorChange}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning={true}
        />
        {isEmpty && (
          <div
            className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none"
            style={{ direction: "ltr", textAlign: "left" }}
          >
            {placeholder}
          </div>
        )}
      </div>
      <style jsx>{`
        [contenteditable] {
          direction: ltr !important;
          text-align: left !important;
          unicode-bidi: normal !important;
        }
        [contenteditable] * {
          direction: ltr !important;
          unicode-bidi: normal !important;
        }
        [contenteditable] h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0.5rem 0;
          line-height: 1.4;
        }
        [contenteditable] h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0.5rem 0;
          line-height: 1.4;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        [contenteditable] strong {
          font-weight: 600;
        }
        [contenteditable] em {
          font-style: italic;
        }
        [contenteditable] u {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
