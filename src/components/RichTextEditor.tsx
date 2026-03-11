import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, onSubmit, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 cursor-pointer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      // Don't emit empty paragraph as actual content if it's practically empty
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          onSubmit?.();
          return true; // prevent default behavior
        }
        return false;
      },
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] px-3 py-2 text-sm text-foreground/90 w-full rounded-md border bg-background custom-scrollbar',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col w-full border rounded-md bg-background focus-within:ring-1 focus-within:ring-primary shadow-sm overflow-hidden", className)}>
      <div className="flex items-center gap-1 border-b bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('bold') && "bg-muted text-foreground"
          )}
          title="Bold"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('italic') && "bg-muted text-foreground"
          )}
          title="Italic"
        >
          <Italic size={14} />
        </button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('bulletList') && "bg-muted text-foreground"
          )}
          title="Bullet List"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('orderedList') && "bg-muted text-foreground"
          )}
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>
        <div className="w-[1px] h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={setLink}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('link') && "bg-muted text-foreground"
          )}
          title="Add Link"
        >
          <LinkIcon size={14} />
        </button>
        {editor.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            title="Remove Link"
          >
            <Unlink size={14} />
          </button>
        )}
      </div>
      <EditorContent editor={editor} className="[&_.ProseMirror]:border-none [&_.ProseMirror]:rounded-none [&_.ProseMirror]:shadow-none [&_.ProseMirror:focus]:ring-0 flex-1 max-h-[200px] overflow-y-auto" />
    </div>
  );
}
