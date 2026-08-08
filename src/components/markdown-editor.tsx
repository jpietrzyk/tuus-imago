import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  textareaId?: string;
}

export function MarkdownEditor({ value, onChange, textareaId }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EasyMDE | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const textarea = document.createElement("textarea");
    textarea.value = value;
    if (textareaId) textarea.id = textareaId;
    container.appendChild(textarea);

    const editor = new EasyMDE({
      element: textarea,
      spellChecker: false,
      status: false,
      toolbar: [
        "bold", "italic", "heading", "|",
        "quote", "unordered-list", "ordered-list", "|",
        "link", "image", "|",
        "preview", "side-by-side", "fullscreen", "|",
        "guide",
      ],
    });

    editorRef.current = editor;
    editor.codemirror.on("change", () => {
      onChangeRef.current(editor.value());
    });

    return () => {
      editor.toTextArea();
      if (container.contains(textarea)) {
        container.removeChild(textarea);
      }
      editorRef.current = null;
    };
    // Initialize once; `value`/`onChange` are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.value() !== value) {
      editor.value(value);
    }
  }, [value]);

  return <div ref={containerRef} className="markdown-editor-wrapper prose max-w-none" />;
}
