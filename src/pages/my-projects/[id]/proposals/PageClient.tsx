
/**
 * 提案一覧ページ（クライアント向け）
 * 自分の案件に対する提案を閲覧・承認できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useParams, useNavigate, Link } from 'react-router-dom';

interface Proposal {
  id: string;
  vendor_id: string;
  vendor_name: string;
  estimated_price: number;
  estimated_duration: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function ProjectProposalsPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const token = await user?.getIdToken();

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals?project_id=${projectId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('提案の取得に失敗しました');
        }

        const data = await response.json();
        setProposals(data.proposals);
      } catch (error) {
        console.error('Proposals fetch error:', error);
      } finally {
        setLoadingProposals(false);
      }
    };

    if (user) {
      fetchProposals();
    }
  }, [user, projectId]);

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm('この提案を承認しますか？\n承認後、ベンダーとのチャットが開始されます。')) {
      return;
    }

    try {
      const token = await user?.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('提案の承認に失敗しました');
      }

      alert('提案を承認しました！');

      // 提案リストを再取得
      const proposalsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (proposalsResponse.ok) {
        const data = await proposalsResponse.json();
        setProposals(data.proposals);
      }

      setSelectedProposal(null);
    } catch (error: any) {
      console.error('Accept proposal error:', error);
      alert(error.message || '提案の承認に失敗しました');
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (!confirm('この提案を却下しますか？')) {
      return;
    }

    try {
      const token = await user?.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('提案の却下に失敗しました');
      }

      alert('提案を却下しました');

      // 提案リストを再取得
      const proposalsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (proposalsResponse.ok) {
        const data = await proposalsResponse.json();
        setProposals(data.proposals);
      }

      setSelectedProposal(null);
    } catch (error: any) {
      console.error('Reject proposal error:', error);
      alert(error.message || '提案の却下に失敗しました');
    }
  };

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
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">受け取った提案</h1>
              <p className="text-sm text-gray-600">案件ID: {projectId}</p>
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

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {proposals.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">まだ提案がありません</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="rounded-lg bg-white p-6 shadow transition hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {proposal.vendor_name}
                  </h3>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      proposal.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : proposal.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {proposal.status === 'accepted'
                      ? '承認済み'
                      : proposal.status === 'rejected'
                      ? '却下'
                      : '審査中'}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      提案金額
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ¥{proposal.estimated_price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      納期
                    </span>
                    <span className="text-sm text-gray-600">
                      {proposal.estimated_duration}日
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      提案日
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(proposal.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {proposal.message}
                  </p>
                </div>

                {proposal.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedProposal(proposal)}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      詳細を見る
                    </button>
                  </div>
                )}

                {proposal.status === 'accepted' && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/projects/${projectId}/chat`)}
                      className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      チャットを開く
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 提案詳細モーダル */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">提案詳細</h2>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  ベンダー名
                </span>
                <span className="mt-1 block text-lg text-gray-900">
                  {selectedProposal.vendor_name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    提案金額
                  </span>
                  <span className="mt-1 block text-2xl font-bold text-blue-600">
                    ¥{selectedProposal.estimated_price.toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    納期
                  </span>
                  <span className="mt-1 block text-2xl font-bold text-gray-900">
                    {selectedProposal.estimated_duration}日
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-gray-700">
                  提案メッセージ
                </span>
                <p className="mt-2 whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-700">
                  {selectedProposal.message}
                </p>
              </div>

              <div className="rounded-md bg-blue-50 p-4">
                <h4 className="text-sm font-semibold text-blue-900">
                  決済について
                </h4>
                <p className="mt-2 text-xs text-blue-700">
                  承認後、着手金（30%）として
                  ¥{Math.floor(selectedProposal.estimated_price * 0.3).toLocaleString()}
                  がベンダーに支払われます。
                  <br />
                  残り70%は作業完了後に支払われます。
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => handleAcceptProposal(selectedProposal.id)}
                className="flex-1 rounded-md bg-green-600 px-4 py-3 text-white hover:bg-green-700"
              >
                提案を承認
              </button>
              <button
                onClick={() => handleRejectProposal(selectedProposal.id)}
                className="flex-1 rounded-md bg-red-600 px-4 py-3 text-white hover:bg-red-700"
              >
                提案を却下
              </button>
              <button
                onClick={() => setSelectedProposal(null)}
                className="rounded-md bg-gray-200 px-4 py-3 text-gray-700 hover:bg-gray-300"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
