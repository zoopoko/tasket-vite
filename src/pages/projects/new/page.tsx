
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Conversation = {
  conversation_id: string;
  latest_message: string;
  created_at: string;
  updated_at: string;
};

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnedConversationId = searchParams.get('conversationId');

  // タブ管理
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // 会話履歴
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // チャット状態
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'こんにちは！自動化したい作業について、お話を聞かせてください。どんな作業を自動化したいですか？',
    },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // 特定の会話をロード
  const loadConversation = useCallback(async (id: string, fromCancel = false) => {
    if (!user || !id) {
      console.log('[DEBUG] Load conversation skipped - user:', !!user, 'id:', id);
      return;
    }

    console.log('[DEBUG] Loading conversation:', id);
    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ai/conversations/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[DEBUG] Load conversation response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[DEBUG] Load conversation error:', errorData);
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      console.log('[DEBUG] Loaded messages:', data.messages.length);

      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      }));

      setMessages(loadedMessages);
      setConversationId(id);
      setActiveTab('new');

      // キャンセルから戻ってきた場合は、入力欄を有効化するためにisCompleteをfalseにする
      if (fromCancel) {
        setIsComplete(false);
      } else {
        // 最後のメッセージが「要件が整理できました」を含むかチェック
        const lastMessage = loadedMessages[loadedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          setIsComplete(
            lastMessage.content.includes('要件が整理できました') ||
              lastMessage.content.includes('案件を作成')
          );
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      // エラーが発生したらクエリパラメータをクリアして新しい会話を開始
      navigate('/projects/new', { replace: true });
    }
  }, [user, navigate]);

  // 会話履歴を取得
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    console.log('[DEBUG] Fetching conversations...');
    setLoadingHistory(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('[DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Conversations data:', data);
        setConversations(data.conversations || []);
      } else {
        const errorData = await response.json();
        console.error('[DEBUG] Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  // キャンセルボタンから戻ってきた場合、会話を復元
  useEffect(() => {
    if (returnedConversationId && user) {
      // fromCancel=true を渡して、入力欄を有効化する
      loadConversation(returnedConversationId, true);
    }
  }, [returnedConversationId, user, loadConversation]);

  // タブ切り替え時に会話履歴を取得
  useEffect(() => {
    if (activeTab === 'history' && user) {
      fetchConversations();
    }
  }, [activeTab, user, fetchConversations]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);
      setIsComplete(data.isComplete);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'エラーが発生しました。もう一度お試しください。',
        },
      ]);
    } finally {
      setIsLoading(false);
      // 送信後、入力欄にフォーカスを戻す
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleGenerateRequirements = () => {
    if (!conversationId) return;

    // 要件定義書の確認・編集画面に遷移
    navigate(`/projects/review?conversationId=${conversationId}`);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'こんにちは！自動化したい作業について、お話を聞かせてください。どんな作業を自動化したいですか？',
      },
    ]);
    setConversationId(null);
    setInput('');
    setIsComplete(false);
    setActiveTab('new');
  };

  if (loading) {
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
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AIと一緒に案件を作成</h1>
        <p className="text-gray-600 mt-2">
          チャットで自動化したい作業について教えてください。AIが要件を整理します。
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* タブ */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('new')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'new'
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            新しい会話
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'history'
                ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            過去の会話
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6">
          {activeTab === 'new' ? (
            // 新しい会話タブ
            <>
              <div className="space-y-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 bg-gray-100">
                      <p className="text-gray-600">入力中...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // IME入力中（日本語変換中）は無視
                    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="メッセージを入力..."
                  disabled={isLoading || isComplete}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || isComplete}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  送信
                </button>
              </div>

              {isComplete && conversationId && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 mb-2">
                    要件の整理が完了しました！要件定義書を生成できます。
                  </p>
                  <button
                    onClick={handleGenerateRequirements}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    要件定義書を生成
                  </button>
                </div>
              )}
            </>
          ) : (
            // 過去の会話タブ
            <div className="min-h-[400px]">
              {loadingHistory ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-600 mb-4">過去の会話がありません</p>
                  <button
                    onClick={handleNewConversation}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    新しい会話を始める
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => loadConversation(conv.conversation_id)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <p className="text-gray-800 font-medium truncate">
                        {conv.latest_message || '（メッセージなし）'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(conv.updated_at).toLocaleString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
