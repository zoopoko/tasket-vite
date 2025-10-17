
/**
 * 案件に対する提案一覧ページ（クライアント用）
 * クライアントが自分の案件に届いた提案を閲覧・承認・拒否できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useParams } from 'react-router-dom';

interface Proposal {
  id: string;
  project_id: string;
  vendor_id: string;
  vendor_name: string;
  message: string;
  estimated_price: number;
  estimated_duration: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Project {
  id: string;
  title: string;
  budget: number;
}

export default function ProposalsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await user?.getIdToken();
        if (!token) return;

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

        // 提案一覧を取得
        const proposalsRes = await fetch(`https://api.task-et.com/api/proposals?project_id=${projectId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!proposalsRes.ok) {
          throw new Error('提案一覧の取得に失敗しました');
        }

        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals);
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

  const handleAccept = async (proposalId: string) => {
    if (!confirm('この提案を承認しますか？承認すると案件のステータスが「進行中」になります。')) {
      return;
    }

    setProcessingId(proposalId);
    setError('');

    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`https://api.task-et.com/api/proposals/${proposalId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('提案の承認に失敗しました');
      }

      alert('提案を承認しました！');

      // 提案一覧を再取得
      const proposalsRes = await fetch(`https://api.task-et.com/api/proposals?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals);
      }
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      setError(err.message || '提案の承認に失敗しました');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    if (!confirm('この提案を拒否しますか？')) {
      return;
    }

    setProcessingId(proposalId);
    setError('');

    try {
      const token = await user?.getIdToken();
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`https://api.task-et.com/api/proposals/${proposalId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('提案の拒否に失敗しました');
      }

      alert('提案を拒否しました');

      // 提案一覧を再取得
      const proposalsRes = await fetch(`https://api.task-et.com/api/proposals?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (proposalsRes.ok) {
        const proposalsData = await proposalsRes.json();
        setProposals(proposalsData.proposals);
      }
    } catch (err: any) {
      console.error('Error rejecting proposal:', err);
      setError(err.message || '提案の拒否に失敗しました');
    } finally {
      setProcessingId(null);
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">提案一覧</h1>
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

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 shadow">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 提案リスト */}
        {proposals.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">まだ提案が届いていません</p>
          </div>
        ) : (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div key={proposal.id} className="rounded-lg bg-white p-6 shadow">
                {/* ステータスバッジ */}
                <div className="mb-4">
                  {proposal.status === 'pending' && (
                    <span className="inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                      未対応
                    </span>
                  )}
                  {proposal.status === 'accepted' && (
                    <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      承認済み
                    </span>
                  )}
                  {proposal.status === 'rejected' && (
                    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      拒否済み
                    </span>
                  )}
                </div>

                {/* ベンダー情報 */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {proposal.vendor_name || 'ベンダー'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    提案日: {new Date(proposal.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {/* 提案メッセージ */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700">提案内容</h4>
                  <p className="mt-2 whitespace-pre-wrap text-gray-700">{proposal.message}</p>
                </div>

                {/* 見積情報 */}
                <div className="mb-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">見積金額</h4>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      ¥{proposal.estimated_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      ※ プラットフォーム手数料3.3%が別途かかります
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">見積納期</h4>
                    <p className="mt-1 text-2xl font-bold text-blue-600">
                      {proposal.estimated_duration}日
                    </p>
                  </div>
                </div>

                {/* アクションボタン（未対応の場合のみ） */}
                {proposal.status === 'pending' && (
                  <div className="flex gap-4 border-t pt-4">
                    <button
                      onClick={() => handleReject(proposal.id)}
                      disabled={processingId === proposal.id}
                      className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100"
                    >
                      {processingId === proposal.id ? '処理中...' : '拒否'}
                    </button>
                    <button
                      onClick={() => handleAccept(proposal.id)}
                      disabled={processingId === proposal.id}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {processingId === proposal.id ? '処理中...' : '承認'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
