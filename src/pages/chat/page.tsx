
/**
 * チャット一覧ページ
 * ユーザーが参加している全てのチャット（進行中の案件）を表示
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, Link } from 'react-router-dom';

interface ChatProject {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  client_id: string;
  client_name: string;
  vendor_id?: string;
  vendor_name?: string;
  role: 'client' | 'vendor';
  last_message?: string;
  last_message_at?: string;
}

export default function ChatListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatProject[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchChats();
    }
  }, [user, loading]);

  const fetchChats = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      // チャット可能な案件一覧を取得
      const response = await fetch(`https://api.task-et.com/api/projects/my-chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('チャット一覧の取得に失敗しました');
      }

      const data = await response.json();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  if (loading || loadingChats) {
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">チャット一覧</h1>
          <p className="mt-2 text-sm text-gray-600">
            進行中の案件とのチャットを管理
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {chats.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              チャットがありません
            </h2>
            <p className="text-gray-600 mb-6">
              進行中の案件がある場合、ここにチャットが表示されます
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/projects"
                className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
              >
                案件を探す
              </Link>
              <Link
                to="/projects/new"
                className="rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
              >
                案件を作成
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                to={`/projects/${chat.id}/chat`}
                className="block rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {chat.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      chat.role === 'client'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {chat.role === 'client' ? 'クライアント' : 'ベンダー'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                  {chat.description}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    相手:{' '}
                    {chat.role === 'client'
                      ? chat.vendor_name || '未定'
                      : chat.client_name}
                  </span>
                  {chat.last_message_at && (
                    <span>
                      {new Date(chat.last_message_at).toLocaleDateString('ja-JP')}
                    </span>
                  )}
                </div>

                {chat.last_message && (
                  <div className="mt-3 rounded bg-gray-50 p-2">
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {chat.last_message}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
