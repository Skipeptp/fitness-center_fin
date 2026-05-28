import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, MessageCircle } from 'lucide-react';
import { supportApi } from '../api/index.js';
import { tokenStore } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/ui/Primitives.jsx';
import Button from '../components/ui/Button.jsx';
import { formatDateTime } from '../utils/format.js';

const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

export default function SupportChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const roomId = String(user.id);   // совпадает с client_id в БД

  useEffect(() => {
    // Грузим историю
    supportApi.messages(roomId).then(r => {
      setMessages(r.data || []);
    }).catch(() => {}).finally(() => setLoading(false));

    // Подключаем сокет
    const socket = io(API_URL, {
      auth: { token: tokenStore.getAccess() },
      transports: ['websocket']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { room_id: roomId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('chat_message', (msg) => {
      setMessages(m => [...m, msg]);
    });
    socket.on('connect_error', () => setConnected(false));

    return () => { socket.disconnect(); };
  }, [roomId]);

  // Скрол вниз при новых сообщениях
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    socketRef.current?.emit('chat_message', { roomId, message: t });
    // Оптимистично добавляем
    setMessages(m => [...m, {
      id: Date.now(), message: t, is_from_client: true, sent_at: new Date().toISOString()
    }]);
    setText('');
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="fade-in support-page">
      <div className="support-header">
        <h1>Поддержка</h1>
        <div className={`support-status ${connected ? 'is-connected' : ''}`}>
          <span className="status-dot" />
          {connected ? 'Онлайн' : 'Отключён'}
        </div>
      </div>

      <div className="support-chat">
        <div className="chat-messages">
          {loading && <div className="text-muted text-center">Загрузка...</div>}
          {!loading && !messages.length && (
            <div className="chat-empty">
              <MessageCircle size={36} />
              <p>Напиши нам - ответим быстро.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg ${msg.is_from_client ? 'is-mine' : 'is-theirs'}`}>
              {!msg.is_from_client && (
                <Avatar user={{ first_name: 'S', last_name: '' }} size={28} />
              )}
              <div className="chat-bubble">
                <div className="chat-text">{msg.message}</div>
                <div className="chat-time">{formatDateTime(msg.sent_at)}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-bar">
          <textarea
            className="chat-input"
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Введи сообщение... (Enter - отправить)"
          />
          <Button icon={Send} onClick={send} disabled={!text.trim() || !connected} aria-label="Отправить" />
        </div>
      </div>

      <style>{`
        .support-page { display: flex; flex-direction: column; height: calc(100vh - var(--header-h) - 48px); }
        .support-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .support-header h1 { margin: 0; }
        .support-status { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
        .support-status.is-connected .status-dot { background: var(--brand-success); }
        .support-status.is-connected { color: var(--brand-success); }
        .support-chat { flex: 1; display: flex; flex-direction: column; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .chat-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); margin: auto; }
        .chat-msg { display: flex; align-items: flex-end; gap: 8px; }
        .chat-msg.is-mine { flex-direction: row-reverse; }
        .chat-bubble { max-width: 72%; }
        .chat-text { background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 10px 14px; font-size: 14px; color: var(--text-primary); }
        .chat-msg.is-mine .chat-text { background: var(--brand-primary); color: #fff; border-radius: var(--radius-md) var(--radius-md) var(--radius-sm) var(--radius-md); }
        .chat-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; text-align: right; }
        .chat-input-bar { display: flex; align-items: center; gap: 8px; padding: 14px; border-top: 1px solid var(--border); }
        .chat-input { flex: 1; resize: none; padding: 10px 14px; background: var(--input-bg); color: var(--text-primary); border: 1px solid var(--input-border); border-radius: var(--radius-md); font-size: 14px; font-family: inherit; line-height: 1.4; }
        .chat-input:focus { outline: none; border-color: var(--input-focus); box-shadow: 0 0 0 3px rgba(230,57,70,.15); }
      `}</style>
    </div>
  );
}
