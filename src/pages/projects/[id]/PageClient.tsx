
/**
 * 案件詳細ページ
 * ベンダーが案件の詳細情報を閲覧し、提案を送信できる
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useParams, Link } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  requirements?: string; // JSON文字列
  technologies?: string; // JSON文字列
  budget: number;
  status: string;
  contract_id?: string;
  created_at: string;
  updated_at: string;
  client_id: string;
  client_name: string;
  client_email: string;
}

export default function ProjectDetailPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState('');

  // 提案フォーム用の状態
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalMessage, setProposalMessage] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // TODO: 認証実装後にトークンを使用
        // const token = await user?.getIdToken();

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('案件の取得に失敗しました');
        }

        const data = await response.json();
        console.log('📋 案件データ取得:', data.project);
        console.log('📝 契約書ID:', data.project.contract_id);
        setProject(data.project);
      } catch (error) {
        console.error('Project fetch error:', error);
        setError('案件の取得に失敗しました');
      } finally {
        setLoadingProject(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSubmitProposal = async () => {
    if (!proposalMessage || !estimatedPrice || !estimatedDuration) {
      setError('すべての項目を入力してください');
      return;
    }

    const priceNum = parseInt(estimatedPrice);
    const durationNum = parseInt(estimatedDuration);

    if (priceNum <= 0 || durationNum <= 0) {
      setError('見積金額と見積納期は正の数で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 認証トークンを取得
      const token = await user?.getIdToken();

      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: projectId,
          message: proposalMessage,
          estimated_price: priceNum,
          estimated_duration: durationNum,
        }),
      });

      if (!response.ok) {
        throw new Error('提案の送信に失敗しました');
      }

      
      alert('提案を送信しました！クライアントからの返信をお待ちください。');

      // フォームをリセット
      setShowProposalForm(false);
      setProposalMessage('');
      setEstimatedPrice('');
      setEstimatedDuration('');
    } catch (err: any) {
      console.error('Proposal submission error:', err);
      setError(err.message || '提案の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-lg bg-red-50 p-6 shadow">
            <p className="text-red-800">{error || '案件が見つかりませんでした'}</p>
            <button
              onClick={() => navigate('/projects')}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              案件一覧に戻る
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
            <h1 className="text-2xl font-bold text-gray-900">案件詳細</h1>
            <div className="flex gap-2">
              {/* 自分の案件の場合は編集ボタンを表示 */}
              {user.uid === project.client_id && (
                <Link
                  to={`/my-projects/${projectId}/edit`}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  編集
                </Link>
              )}
              <Link
                to="/projects"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                一覧に戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          {/* タイトル */}
          <h2 className="text-3xl font-bold text-gray-900">{project.title}</h2>

          {/* ステータス */}
          <div className="mt-4">
            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {project.status === 'open' ? '募集中' : project.status}
            </span>
          </div>

          {/* 予算 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700">予算</h3>
            <p className="mt-1 text-3xl font-bold text-blue-600">
              ¥{project.budget.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              ※ プラットフォーム手数料3.3%が別途かかります
            </p>
          </div>

          {/* 案件説明 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">案件の説明</h3>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">{project.description}</p>
          </div>

          {/* 要件定義 */}
          {project.requirements && (() => {
            try {
              const requirements = JSON.parse(project.requirements);

              // 新しい構造化された要件定義形式
              if (Array.isArray(requirements) && requirements[0]?.category) {
                return (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">要件定義</h3>
                    <div className="space-y-6">
                      {requirements.map((section: any, index: number) => (
                        <div key={index} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                          <h4 className="mb-3 text-base font-semibold text-blue-700">{section.category}</h4>
                          <ul className="space-y-2">
                            {section.items.map((item: string, itemIndex: number) => (
                              <li key={itemIndex} className="flex gap-2 text-sm text-gray-700">
                                <span className="text-blue-500">•</span>
                                <span className="flex-1 whitespace-pre-wrap leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // 古い配列形式
              if (Array.isArray(requirements)) {
                return (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">要件定義</h3>
                    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                      <ul className="space-y-2">
                        {requirements.map((req: any, index: number) => (
                          <li key={index} className="flex gap-2 text-sm text-gray-700">
                            <span className="text-blue-500">•</span>
                            <span className="flex-1 whitespace-pre-wrap leading-relaxed">
                              {typeof req === 'string' ? req : (req.title || req.heading || JSON.stringify(req))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }

              // オブジェクト形式
              if (typeof requirements === 'object') {
                return (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">要件定義</h3>
                    <div className="space-y-4">
                      {Object.entries(requirements).map(([key, value]: [string, any]) => (
                        <div key={key} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                          <h4 className="mb-2 font-medium text-gray-900">{key}</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {typeof value === 'string' ? value : Array.isArray(value) ? value.join('\n') : JSON.stringify(value, null, 2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              // その他
              return (
                <div className="mt-8 border-t pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">要件定義</h3>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {typeof requirements === 'string' ? requirements : JSON.stringify(requirements, null, 2)}
                    </p>
                  </div>
                </div>
              );
            } catch (e) {
              // JSONパースに失敗した場合は文字列として表示
              return (
                <div className="mt-8 border-t pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">要件定義</h3>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{project.requirements}</p>
                  </div>
                </div>
              );
            }
          })()}

          {/* 技術スタック */}
          {(() => {
            try {
              // requirementsから技術情報を抽出
              const requirements = project.requirements ? JSON.parse(project.requirements) : null;
              let technologies: string[] = [];

              // 新しい形式の要件定義から技術スタックを抽出
              if (requirements && typeof requirements === 'object' && 'technologies' in requirements && Array.isArray(requirements.technologies)) {
                technologies = requirements.technologies;
              }
              // 要件定義内の技術要件セクションから抽出
              else if (Array.isArray(requirements)) {
                const techSection = requirements.find((r: any) => r.category === '技術要件');
                if (techSection?.items) {
                  technologies = techSection.items;
                }
              }

              if (technologies.length > 0) {
                return (
                  <div className="mt-8 border-t pt-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">技術スタック</h3>
                    <div className="flex flex-wrap gap-2">
                      {technologies.map((tech: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            } catch (e) {
              return null;
            }
          })()}

          {/* クライアント情報 */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">クライアント情報</h3>
            <div className="mt-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">名前: </span>
                <span className="text-sm text-gray-600">{project.client_name || '未設定'}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">投稿日: </span>
                <span className="text-sm text-gray-600">
                  {new Date(project.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
          </div>

          {/* 契約書リンク */}
          {(() => {
            console.log('🔍 契約書リンク表示チェック:', {
              'contract_id': project.contract_id,
              'contract_id型': typeof project.contract_id,
              '条件判定': !!project.contract_id
            });
            return project.contract_id ? (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900">契約書</h3>
                <p className="mt-2 text-sm text-gray-600">
                  この案件には契約書（案）が添付されています。契約内容を確認してから提案してください。
                </p>
                <Link
                  to={`/contracts/${project.contract_id}`}
                  className="mt-4 inline-block rounded-md bg-green-600 px-6 py-3 text-white hover:bg-green-700"
                >
                  契約書を確認する
                </Link>
              </div>
            ) : null;
          })()}

          {/* 提案送信セクション */}
          <div className="mt-8 border-t pt-6">
            {/* 自分の案件には提案できない */}
            {user.uid === project.client_id ? (
              <div className="rounded-lg bg-gray-50 p-6 text-center">
                <p className="text-gray-600">これはあなたが投稿した案件です。</p>
                <Link
                  to={`/my-projects/${projectId}/proposals`}
                  className="mt-4 inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                >
                  受け取った提案を確認
                </Link>
              </div>
            ) : !showProposalForm ? (
              <div>
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="w-full rounded-md bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
                >
                  この案件に提案する
                </button>
                <p className="mt-2 text-center text-sm text-gray-500">
                  提案を送信すると、クライアントがあなたのプロフィールを確認できます
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">提案を作成</h3>

                {/* 提案メッセージ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提案メッセージ
                  </label>
                  <textarea
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    rows={6}
                    placeholder="あなたの提案内容や経験、アプローチ方法を記述してください..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 見積金額 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    見積金額（円）
                  </label>
                  <input
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder="例: 500000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    ※ プラットフォーム手数料3.3%が別途発生します
                  </p>
                </div>

                {/* 見積納期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    見積納期（日数）
                  </label>
                  <input
                    type="number"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    placeholder="例: 30"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    契約締結から何日で完了予定か
                  </p>
                </div>

                {/* エラー表示 */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {/* アクションボタン */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowProposalForm(false);
                      setError('');
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSubmitProposal}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '送信中...' : '提案を送信'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
