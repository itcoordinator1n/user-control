'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Message } from '@/types/tickets';

interface ChatTimelineProps {
  messages: Message[];
  isReadOnly?: boolean;
  onSendReply?: (text: string) => void;
  isSending?: boolean;
  /** Llama a esta función para cargar mensajes anteriores */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ChatTimeline({
  messages,
  isReadOnly = true,
  onSendReply,
  isSending = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ChatTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');

  // Scroll al último mensaje cuando llegan mensajes nuevos
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = replyText.trim();
    if (!text || !onSendReply) return;
    onSendReply(text);
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {/* Botón cargar más (historial hacia arriba) */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-xs text-muted-foreground"
            >
              {isLoadingMore ? 'Cargando...' : 'Ver mensajes anteriores'}
            </Button>
          </div>
        )}

        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay mensajes aún.
          </p>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Área de respuesta o aviso de solo lectura */}
      {isReadOnly ? (
        <div className="border-t bg-muted/30 px-4 py-3">
          <p className="text-center text-xs text-muted-foreground">
            Para comunicarte con el técnico, usá WhatsApp.
          </p>
        </div>
      ) : (
        <div className="border-t p-4 space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu respuesta... (Enter para enviar, Shift+Enter para nueva línea)"
            className="min-h-[80px] resize-none text-sm"
            disabled={isSending}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!replyText.trim() || isSending}
            >
              <Send className="mr-2 h-3.5 w-3.5" />
              {isSending ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Burbuja individual ───────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_type === 'user';
  const isBot = message.sender_type === 'bot';
  const isTech = message.sender_type === 'technician';

  const time = new Date(message.created_at).toLocaleTimeString('es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn('flex gap-2', {
        'justify-start': isUser,
        'justify-end': isBot || isTech,
      })}
    >
      <div
        className={cn('max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm', {
          // Usuario: izquierda, gris claro
          'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100 rounded-tl-sm': isUser,
          // Bot: derecha, azul suave
          'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100 rounded-tr-sm': isBot,
          // Técnico: derecha, azul fuerte
          'bg-blue-600 text-white dark:bg-blue-700 rounded-tr-sm': isTech,
        })}
      >
        {/* Nombre del técnico */}
        {isTech && message.sender_name && (
          <p className="mb-1 text-[11px] font-semibold text-blue-200">
            {message.sender_name}
          </p>
        )}

        {/* Contenido */}
        {message.content_type === 'text' && (
          <p className="whitespace-pre-wrap break-words">{message.content_text}</p>
        )}

        {message.content_type === 'image' && message.media_url && (
          <a href={message.media_url} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.media_url}
              alt="imagen"
              className="max-h-48 rounded-lg object-cover"
            />
          </a>
        )}

        {['document', 'audio', 'video'].includes(message.content_type) && message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-xs"
          >
            Ver archivo adjunto
          </a>
        )}

        {/* Footer: hora + estado WA */}
        <div
          className={cn('mt-1 flex items-center gap-1 text-[10px]', {
            'text-gray-400': isUser,
            'text-blue-400': isBot,
            'text-blue-200': isTech,
          })}
        >
          <span>{time}</span>
          {message.channel === 'whatsapp' && (
            <span title={message.wa_status ?? ''}>
              <WaStatus status={message.wa_status} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function WaStatus({ status }: { status: Message['wa_status'] }) {
  if (!status) return null;
  if (status === 'sent')      return <span>✓</span>;
  if (status === 'delivered') return <span>✓✓</span>;
  if (status === 'read')      return <span className="text-blue-400">✓✓</span>;
  return null;
}
