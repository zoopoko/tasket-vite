
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  client_id: string;
}

interface Proposal {
  id: string;
  vendor_id: string;
  estimated_price: number;
  estimated_days: number;
  message: string;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  platform_fee: number;
  payment_type: 'deposit' | 'final';
  status: string;
  created_at: string;
}

export default function FinalPaymentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // 完了金の計算（70%）
  const finalAmount = proposal ? Math.floor(proposal.estimated_price * 0.7) : 0;
  const platformFee = Math.floor(finalAmount * 0.033); // 3.3%
  const stripeFee = Math.floor(finalAmount * 0.036); // 3.6%
  const totalAmount = finalAmount + stripeFee;

  // 着手金
  const depositPayment = payments.find((p) => p.payment_type === 'deposit');
  const depositAmount = depositPayment?.amount || 0;

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signin');
        return;
      }

      const token = await user.getIdToken();

      // 案件情報を取得
      const projectRes = await fetch(`https://api.task-et.com/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!projectRes.ok) {
        throw new Error('案件の取得に失敗しました');
      }

      const projectData = await projectRes.json();
      setProject(projectData.project);

      // 案件がin_progressでない場合はエラー
      if (projectData.project.status !== 'in_progress') {
        setError('この案件は進行中ではありません');
        return;
      }

      // 承認済み提案を取得
      const proposalsRes = await fetch(`https://api.task-et.com/api/proposals?project_id=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!proposalsRes.ok) {
        throw new Error('提案の取得に失敗しました');
      }

      const proposalsData = await proposalsRes.json();
      const acceptedProposal = proposalsData.proposals.find((p: Proposal) => p.status === 'accepted');

      if (!acceptedProposal) {
        setError('承認済みの提案が見つかりません');
        return;
      }

      setProposal(acceptedProposal);

      // 決済履歴を取得
      const paymentsRes = await fetch(`https://api.task-et.com/api/payments?project_id=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProject = async () => {
    if (!project || !proposal) return;

    const confirmed = confirm(
      '案件を検収完了しますか？\n完了金の決済が行われ、案件が完了状態になります。'
    );

    if (!confirmed) return;

    setProcessing(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signin');
        return;
      }

      const token = await user.getIdToken();

      // 案件完了エンドポイントを呼び出し（完了金の決済も含む）
      const response = await fetch(`https://api.task-et.com/api/projects/${projectId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '検収完了処理に失敗しました');
      }

      // 決済成功 - 案件詳細ページへリダイレクト
      alert('案件が完了しました！完了金の決済が完了しました。\nベンダーをレビューしてください。');
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      console.error('Complete project error:', err);
      setError(err.message || '検収完了処理に失敗しました');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">案件検収・完了金のお支払い</h1>
          <p className="text-gray-600">
            案件の成果物を確認し、検収完了することで完了金（70%）をお支払いください
          </p>
        </div>

        {/* 案件情報 */}
        {project && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold text-gray-900 mb-2">案件情報</h2>
            <p className="text-gray-700 mb-1">{project.title}</p>
            <p className="text-sm text-gray-500">
              ステータス: <span className="font-semibold">進行中</span>
            </p>
          </div>
        )}

        {/* 料金明細 */}
        {proposal && (
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">料金明細</h2>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>見積金額（総額）</span>
                <span>¥{proposal.estimated_price.toLocaleString()}</span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>着手金（30%）- 支払済</span>
                  <span className="text-green-600">✓ ¥{depositAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-700 mb-2">
                  <span>完了金（70%）</span>
                  <span>¥{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span className="ml-4">うち、プラットフォーム手数料（3.3%）</span>
                  <span>¥{platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="ml-4">決済手数料（3.6%）</span>
                  <span>¥{stripeFee.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t-2 border-gray-300 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>お支払い金額</span>
                  <span>¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>💡 検収完了について</strong>
                <br />
                検収完了ボタンを押すと、完了金がベンダーに支払われ、案件が完了状態になります。
                <br />
                必ず成果物を確認してから、検収完了を行ってください。
              </p>
            </div>
          </div>
        )}

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 決済ボタン */}
        <div className="space-y-3">
          <button
            onClick={handleCompleteProject}
            disabled={processing || !proposal}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {processing ? '処理中...' : `検収完了 & ¥${totalAmount.toLocaleString()} を支払う`}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            キャンセル
          </button>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>注意事項:</strong>
            <br />
            • 検収完了を行うと、完了金がベンダーに送金されます
            <br />
            • 案件が完了状態になり、双方がレビューを投稿できるようになります
            <br />
            • 検収完了後のキャンセルはできませんので、必ず成果物を確認してから実行してください
            <br />
            • 本番環境では、Stripe決済システムを使用した安全な決済処理を行います
          </p>
        </div>
      </div>
    </div>
  );
}
