
/**
 * 提案管理ページ
 * 送信した提案と受け取った提案を一覧表示
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, Link } from 'react-router-dom';

interface Proposal {
  id: string;
  project_id: string;
  project_title: string;
  vendor_id: string;
  vendor_name: string;
  client_id: string;
  client_name: string;
  message: string;
  estimated_price: number;
  estimated_duration: number;
  status: 'pending' | 'accepted' | 'rejected' | 'rejected_auto';
  created_at: string;
  type: 'sent' | 'received';
}

export default function ProposalsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && user) {
      fetchProposals();
    }
  }, [user, loading]);

  const fetchProposals = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals/my-proposals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('提案一覧の取得に失敗しました');
      }

      const data = await response.json();
      setProposals(data.proposals || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoadingProposals(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'rejected_auto':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '審査中';
      case 'accepted':
        return '承認済み';
      case 'rejected':
        return '却下';
      case 'rejected_auto':
        return '自動却下';
      default:
        return status;
    }
  };

  const filteredProposals = proposals.filter((proposal) => {
    if (filter === 'all') return true;
    return proposal.type === filter;
  });

  if (loading || loadingProposals) {
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
          <h1 className="text-3xl font-bold text-gray-900">提案管理</h1>
          <p className="mt-2 text-sm text-gray-600">
            送信した提案と受け取った提案を管理
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* フィルター */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            すべて ({proposals.length})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              filter === 'sent'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            送信済み ({proposals.filter((p) => p.type === 'sent').length})
          </button>
          <button
            onClick={() => setFilter('received')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              filter === 'received'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            受信済み ({proposals.filter((p) => p.type === 'received').length})
          </button>
        </div>

        {filteredProposals.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'sent' && '送信した提案がありません'}
              {filter === 'received' && '受け取った提案がありません'}
              {filter === 'all' && '提案がありません'}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'sent' && '案件に提案を送信すると、ここに表示されます'}
              {filter === 'received' && '案件を作成すると、提案を受け取れます'}
              {filter === 'all' && '提案の送信または受信を開始しましょう'}
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
          <div className="grid gap-4">
            {filteredProposals.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-lg bg-white p-6 shadow transition hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {proposal.project_title}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          proposal.status
                        )}`}
                      >
                        {getStatusText(proposal.status)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          proposal.type === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {proposal.type === 'sent' ? '送信済み' : '受信'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        {proposal.type === 'sent' ? 'クライアント' : 'ベンダー'}:{' '}
                        {proposal.type === 'sent'
                          ? proposal.client_name
                          : proposal.vendor_name}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(proposal.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-xs text-gray-600 mb-1">見積金額</p>
                    <p className="text-lg font-bold text-blue-600">
                      ¥{proposal.estimated_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded bg-gray-50 p-3">
                    <p className="text-xs text-gray-600 mb-1">納期</p>
                    <p className="text-lg font-bold text-gray-900">
                      {proposal.estimated_duration}日
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                  {proposal.message}
                </p>

                <div className="flex gap-2">
                  <Link
                    to={`/projects/${proposal.project_id}`}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    案件を見る
                  </Link>
                  {proposal.type === 'received' && proposal.status === 'pending' && (
                    <Link
                      to={`/my-projects/${proposal.project_id}/proposals`}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      提案を確認
                    </Link>
                  )}
                  {proposal.status === 'accepted' && (
                    <Link
                      to={`/projects/${proposal.project_id}/chat`}
                      className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      チャットを開く
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
