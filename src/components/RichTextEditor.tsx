import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Unlink, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, onSubmit, className }: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          onSubmit?.();
          return true;
        }
        return false;
      },
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] px-3 py-2 text-sm text-foreground/90 w-full bg-background custom-scrollbar',
      },
    },
  });

  const openLinkModal = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkModal(true);
  }, [editor]);

  const saveLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      let finalUrl = linkUrl;
      if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !finalUrl.startsWith('#')) {
        finalUrl = `https://${finalUrl}`;
      }

      if (editor.state.selection.empty) {
        editor.chain().focus().insertContent(finalUrl).extendMarkRange('link').setLink({ href: finalUrl }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
      }
    }
    setShowLinkModal(false);
  }, [editor, linkUrl]);

  useEffect(() => {
    if (showLinkModal && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkModal]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("flex flex-col w-full border rounded-md bg-background focus-within:ring-1 focus-within:ring-primary shadow-sm overflow-hidden relative", className)}>
      <div className="flex items-center gap-1 border-b bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors",
            editor.isActive('bold') && "bg-muted text-foreground font-bold"
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
            editor.isActive('italic') && "bg-muted text-foreground italic"
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
          onClick={openLinkModal}
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

      <AnimatePresence>
        {showLinkModal && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[38px] left-1 right-1 z-30 bg-card border shadow-xl rounded-md p-2 flex items-center gap-2"
          >
            <input
              ref={linkInputRef}
              type="text"
              placeholder="Paste or type a link..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  saveLink();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLinkModal(false);
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1 px-1 outline-none"
            />
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={saveLink}
                className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <EditorContent 
        editor={editor} 
        className="[&_.ProseMirror]:border-none [&_.ProseMirror]:rounded-none [&_.ProseMirror]:shadow-none [&_.ProseMirror:focus]:ring-0 flex-1 max-h-[200px] overflow-y-auto" 
      />
    </div>
  );
}
