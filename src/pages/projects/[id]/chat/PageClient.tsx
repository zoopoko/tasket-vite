
/**
 * プロジェクトチャットページ
 * クライアントとベンダーがやり取りする
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  attachment_url?: string | null;
  created_at: string;
}

export default function ProjectChatPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await user?.getIdToken();

        const response = await fetch(`/api/messages?projectId=${projectId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('メッセージの取得に失敗しました');
        }

        const data = await response.json();
        setMessages(data.messages);
      } catch (error) {
        console.error('Messages fetch error:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (user) {
      fetchMessages();

      // ポーリングで新しいメッセージを取得
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [user, projectId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        alert('ファイルサイズは10MB以下にしてください');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!input.trim() && !uploadedFile) || sending) return;

    const messageContent = input;
    setInput('');
    setSending(true);

    try {
      const token = await user?.getIdToken();
      let attachmentUrl = null;

      // ファイルアップロード処理
      if (uploadedFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('ファイルのアップロードに失敗しました');
        }

        const uploadData = await uploadResponse.json();
        attachmentUrl = uploadData.url;
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setUploading(false);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          content: messageContent || '（ファイル添付）',
          attachment_url: attachmentUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました');
      }

      const data = await response.json();

      // 新しいメッセージを追加
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          sender_id: user?.uid || '',
          sender_name: user?.displayName || user?.email || '',
          content: messageContent || '（ファイル添付）',
          attachment_url: attachmentUrl,
          created_at: data.message.created_at,
        },
      ]);
    } catch (error) {
      console.error('Send message error:', error);
      alert('メッセージの送信に失敗しました');
      setInput(messageContent); // 入力を復元
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  if (loading || loadingMessages) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                プロジェクトチャット
              </h1>
              <p className="text-sm text-gray-600">案件ID: {projectId}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/projects/${projectId}`}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                案件詳細
              </Link>
              <Link
                to="/dashboard"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ダッシュボード
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* チャットエリア */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-600">
                まだメッセージがありません。最初のメッセージを送信しましょう！
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_id === user?.uid
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.sender_id === user?.uid
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">
                      {message.sender_name}
                    </span>
                    <span
                      className={`text-xs ${
                        message.sender_id === user?.uid
                          ? 'text-blue-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleString('ja-JP')}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                  {message.attachment_url && (
                    <div className="mt-2">
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                          message.sender_id === user?.uid
                            ? 'bg-blue-700 hover:bg-blue-800'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        <span>📎</span>
                        <span>添付ファイル</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          {/* ファイル選択プレビュー */}
          {uploadedFile && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
              <span className="text-lg">📎</span>
              <span className="flex-1 truncate text-sm text-gray-700">
                {uploadedFile.name}
              </span>
              <span className="text-xs text-gray-500">
                {(uploadedFile.size / 1024).toFixed(1)} KB
              </span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-full p-1 text-red-600 hover:bg-red-100"
                aria-label="ファイルを削除"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {/* ファイル選択ボタン */}
            <div className="flex items-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                📎
              </label>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="メッセージを入力... (Shift+Enterで改行)"
              className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={3}
              disabled={sending || uploading}
            />
            <button
              type="submit"
              disabled={sending || uploading || (!input.trim() && !uploadedFile)}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'アップロード中...' : '送信'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Enter: 送信 / Shift+Enter: 改行 / ファイルサイズ上限: 10MB
          </p>
        </form>
      </div>
    </div>
  );
}
