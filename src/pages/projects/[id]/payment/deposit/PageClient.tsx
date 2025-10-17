
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

export default function DepositPaymentPage() {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // 着手金の計算（30%）
  const depositAmount = proposal ? Math.floor(proposal.estimated_price * 0.3) : 0;
  const platformFee = Math.floor(depositAmount * 0.033); // 3.3%
  const stripeFee = Math.floor(depositAmount * 0.036); // 3.6%
  const totalAmount = depositAmount + stripeFee;

  useEffect(() => {
    fetchProjectAndProposal();
  }, [projectId]);

  const fetchProjectAndProposal = async () => {
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
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!project || !proposal) return;

    setProcessing(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/signin');
        return;
      }

      const token = await user.getIdToken();

      // TODO: 本番環境ではStripe Elements統合
      // 現在はモック決済処理
      const response = await fetch(`https://api.task-et.com/api/projects/${projectId}/accept-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proposal_id: proposal.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || '決済に失敗しました');
      }

      // 決済成功 - 案件詳細ページへリダイレクト
      alert('着手金の決済が完了しました！案件が開始されました。');
      navigate(`/projects/${projectId}`);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '決済処理に失敗しました');
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">着手金のお支払い</h1>
          <p className="text-gray-600">
            案件を開始するため、着手金（30%）をお支払いください
          </p>
        </div>

        {/* 案件情報 */}
        {project && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold text-gray-900 mb-2">案件情報</h2>
            <p className="text-gray-700">{project.title}</p>
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
                  <span>着手金（30%）</span>
                  <span>¥{depositAmount.toLocaleString()}</span>
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
                <strong>💡 着手金について</strong>
                <br />
                着手金は案件開始時にベンダーに支払われます。残りの完了金（70%）は、案件完了後にお支払いいただきます。
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
            onClick={handlePayment}
            disabled={processing || !proposal}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {processing ? '処理中...' : `¥${totalAmount.toLocaleString()} を支払う`}
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
            • 決済が完了すると、案件が開始されベンダーとチャットでやり取りできるようになります
            <br />
            • 着手金は案件開始時にベンダーに送金されます
            <br />
            • 完了金は案件完了後の検収時にお支払いいただきます
            <br />
            • 本番環境では、Stripe決済システムを使用した安全な決済処理を行います
          </p>
        </div>
      </div>
    </div>
  );
}
