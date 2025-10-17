
/**
 * チャットページ
 * クライアントとベンダーが案件に関してやりとりする
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useParams } from 'react-router-dom';

interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

export default function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 案件情報を取得
        const projectRes = await fetch(`https://api.task-et.com/api/projects/${projectId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!projectRes.ok) {
          throw new Error('案件の取得に失敗しました');
        }

        const projectData = await projectRes.json();
        setProject(projectData.project);

        // メッセージ一覧を取得
        fetchMessages();
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setLoadingData(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  const fetchMessages = async () => {
    try {
      const token = await user?.getIdToken();
      if (!token) return;

      const messagesRes = await fetch(`https://api.task-et.com/api/messages?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!messagesRes.ok) {
        throw new Error('メッセージ一覧の取得に失敗しました');
      }

      const messagesData = await messagesRes.json();
      setMessages(messagesData.messages);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    // メッセージが更新されたら最下部にスクロール
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5秒ごとにメッセージを自動取得
  useEffect(() => {
    const interval = setInterval(() => {
      if (projectId && !loadingData) {
        fetchMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [projectId, loadingData]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsSending(true);
    setError('');

    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('https://api.task-et.com/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          content: inputMessage.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('メッセージの送信に失敗しました');
      }

      // メッセージを即座に取得
      await fetchMessages();

      // 入力をクリア
      setInputMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'メッセージの送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-red-50 p-6 shadow">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">チャット</h1>
              {project && (
                <p className="text-sm text-gray-600">
                  案件: {project.title}
                </p>
              )}
            </div>
            <Link
              to="/dashboard"
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      {/* チャットエリア */}
      <main className="mx-auto flex flex-1 flex-col overflow-hidden w-full max-w-4xl">
        {/* メッセージ一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">メッセージがありません</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === 'temp-user-id' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    message.sender_id === 'temp-user-id'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow'
                  }`}
                >
                  <p className="text-xs mb-1 opacity-75">
                    {message.sender_name || 'ユーザー'}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.created_at).toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="border-t bg-white p-4">
          {error && (
            <div className="mb-2 rounded-lg bg-red-50 p-2">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力... (Shift+Enterで改行)"
              className="flex-1 resize-none rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              rows={2}
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !inputMessage.trim()}
              className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSending ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
