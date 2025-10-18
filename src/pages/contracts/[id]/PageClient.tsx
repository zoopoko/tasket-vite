
/**
 * 契約書詳細ページ
 * クライアントとベンダーが契約書を閲覧・編集・提出・承認するページ
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { printContractToPDF } from '@/lib/generate-contract-pdf';

interface ContractContent {
  title: string;
  description: string;
  amount: number;
  duration_days: number;
  terms: string[];
}

interface PersonInfo {
  name: string;
  email: string;
  address: string;
  phone: string;
}

interface Contract {
  id: string;
  project_id: string;
  client_id: string;
  vendor_id: string | null;
  status: string;
  version: number;
  content: ContractContent;
  client_info: PersonInfo;
  vendor_info: PersonInfo | null;
  client_info_visible: boolean;
  vendor_info_visible: boolean;
  pdf_url: string | null;
  is_editable: boolean;
  last_edited_by: string;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function ContractPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const contractId = params.id as string;
  const contractRef = useRef<HTMLDivElement>(null);

  const [contract, setContract] = useState<Contract | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<ContractContent | null>(null);
  const [showVendorInfoForm, setShowVendorInfoForm] = useState(false);
  const [vendorInfo, setVendorInfo] = useState<PersonInfo>({
    name: '',
    email: user?.email || '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.email && vendorInfo.email === '') {
      setVendorInfo(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const token = await user?.getIdToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${contractId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('契約書の取得に失敗しました');
        }

        const data = await response.json();
        setContract(data.contract);
        setEditedContent(data.contract.content);
      } catch (err: any) {
        console.error('Error fetching contract:', err);
        setError(err.message || '契約書の取得に失敗しました');
      } finally {
        setLoadingData(false);
      }
    };

    if (contractId && user) {
      fetchContract();
    }
  }, [contractId, user]);

  const handleEdit = () => {
    setIsEditing(true);
    // 現在の契約内容で編集フォームを初期化
    setEditedContent(contract?.content || null);
  };

  const handleSaveEdit = async () => {
    if (!editedContent) return;

    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('認証が必要です');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: editedContent,
          reason: '契約内容を編集',
        }),
      });

      if (!response.ok) {
        throw new Error('契約書の編集に失敗しました');
      }

      alert('契約書を更新しました。相手の確認待ちです。');
      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating contract:', err);
      setError(err.message || '契約書の編集に失敗しました');
    }
  };

  const handleSubmitVendorInfo = async () => {
    if (!vendorInfo.name || !vendorInfo.email) {
      alert('氏名とメールアドレスは必須です');
      return;
    }

    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('認証が必要です');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${contractId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vendor_info: vendorInfo }),
      });

      if (!response.ok) {
        throw new Error('契約書の提出に失敗しました');
      }

      alert('契約書を提出しました。クライアントの承認をお待ちください。');
      setShowVendorInfoForm(false);
      window.location.reload();
    } catch (err: any) {
      console.error('Error submitting contract:', err);
      setError(err.message || '契約書の提出に失敗しました');
    }
  };

  const handleApprove = async () => {
    if (!confirm('この契約書を承認して契約を締結しますか？締結後は編集できません。')) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      if (!token) throw new Error('認証が必要です');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/contracts/${contractId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('契約の承認に失敗しました');
      }

      alert('契約を締結しました！');
      window.location.reload();
    } catch (err: any) {
      console.error('Error approving contract:', err);
      setError(err.message || '契約の承認に失敗しました');
    }
  };

  const handleDownloadPDF = () => {
    if (!contract || !contractRef.current) return;

    // ブラウザの印刷機能を使用（より安定）
    printContractToPDF(contractRef.current);
  };

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user || !contract) {
    return null;
  }

  const isClient = contract.client_id === user.uid;
  const isVendor = contract.vendor_id === user.uid;
  const canEdit = contract.is_editable && (isClient || isVendor);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">契約書</h1>
              <p className="text-sm text-gray-600">
                ステータス: {
                  contract.status === 'draft' ? '下書き' :
                  contract.status === 'published' ? '公開済み' :
                  contract.status === 'pending_vendor_approval' ? 'ベンダー確認待ち' :
                  contract.status === 'pending_client_approval' ? 'クライアント承認待ち' :
                  contract.status === 'signed' ? '契約締結' : contract.status
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <span>📄</span>
                PDF出力（印刷）
              </button>
              <Link
                to="/dashboard"
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                ダッシュボードに戻る
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" ref={contractRef}>
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 shadow">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 契約書内容 */}
        <div className="rounded-lg bg-white p-8 shadow">
          <h2 className="mb-6 text-3xl font-bold text-center">
            {isEditing ? (
              <input
                type="text"
                value={editedContent?.title || ''}
                onChange={(e) => setEditedContent(prev => prev ? {...prev, title: e.target.value} : null)}
                className="w-full border-b-2 border-gray-300 px-2 py-1 text-center focus:border-blue-500 focus:outline-none"
              />
            ) : (
              contract.content.title
            )}
          </h2>

          {/* 当事者情報 */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">発注者（クライアント）</h3>
              <p className="text-sm">
                氏名: <span className={contract.client_info.name.includes('●') ? 'text-gray-400' : ''}>{contract.client_info.name}</span>
              </p>
              <p className="text-sm">
                メール: <span className={contract.client_info.email.includes('●') ? 'text-gray-400' : ''}>{contract.client_info.email}</span>
              </p>
              <p className="text-sm">
                住所: <span className={contract.client_info.address?.includes('●') ? 'text-gray-400' : ''}>{contract.client_info.address || '未設定'}</span>
              </p>
              <p className="text-sm">
                電話: <span className={contract.client_info.phone?.includes('●') ? 'text-gray-400' : ''}>{contract.client_info.phone || '未設定'}</span>
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h3 className="mb-2 font-semibold text-green-900">受注者（ベンダー）</h3>
              {contract.vendor_info ? (
                <>
                  <p className="text-sm">
                    氏名: <span className={contract.vendor_info.name.includes('●') ? 'text-gray-400' : ''}>{contract.vendor_info.name}</span>
                  </p>
                  <p className="text-sm">
                    メール: <span className={contract.vendor_info.email.includes('●') ? 'text-gray-400' : ''}>{contract.vendor_info.email}</span>
                  </p>
                  <p className="text-sm">
                    住所: <span className={contract.vendor_info.address?.includes('●') ? 'text-gray-400' : ''}>{contract.vendor_info.address || '未設定'}</span>
                  </p>
                  <p className="text-sm">
                    電話: <span className={contract.vendor_info.phone?.includes('●') ? 'text-gray-400' : ''}>{contract.vendor_info.phone || '未設定'}</span>
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">※ベンダー情報は未提出です</p>
              )}
            </div>
          </div>

          {/* 契約内容 */}
          <div className="mb-6">
            <h3 className="mb-2 font-semibold">業務内容</h3>
            {isEditing ? (
              <textarea
                value={editedContent?.description || ''}
                onChange={(e) => setEditedContent(prev => prev ? {...prev, description: e.target.value} : null)}
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                rows={4}
              />
            ) : (
              <p className="whitespace-pre-wrap text-gray-700">{contract.content.description}</p>
            )}
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 font-semibold">報酬金額</h3>
              {isEditing ? (
                <input
                  type="number"
                  value={editedContent?.amount || 0}
                  onChange={(e) => setEditedContent(prev => prev ? {...prev, amount: parseInt(e.target.value)} : null)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  ¥{contract.content.amount.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <h3 className="mb-2 font-semibold">納期</h3>
              {isEditing ? (
                <input
                  type="number"
                  value={editedContent?.duration_days || 0}
                  onChange={(e) => setEditedContent(prev => prev ? {...prev, duration_days: parseInt(e.target.value)} : null)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-2xl font-bold text-blue-600">
                  {contract.content.duration_days}日
                </p>
              )}
            </div>
          </div>

          {/* 契約条項 */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-semibold">契約条項</h3>
            <div className="space-y-4">
              {isEditing ? (
                editedContent?.terms.map((term, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <textarea
                      value={term}
                      onChange={(e) => {
                        const newTerms = [...(editedContent?.terms || [])];
                        newTerms[index] = e.target.value;
                        setEditedContent(prev => prev ? {...prev, terms: newTerms} : null);
                      }}
                      className="w-full rounded-md border border-gray-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                      rows={6}
                    />
                  </div>
                ))
              ) : (
                contract.content.terms.map((term, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{term}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 border-t pt-6">
            {/* 下書き状態 - クライアントのみ編集可能 */}
            {contract.status === 'draft' && isClient && !isEditing && (
              <button
                onClick={handleEdit}
                className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                契約書を編集
              </button>
            )}

            {/* 編集中 */}
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  更新
                </button>
              </>
            )}

            {/* 公開済み・ベンダー確認待ち - ベンダーが個人情報提出 */}
            {(contract.status === 'published' || contract.status === 'pending_vendor_approval') && !isClient && !contract.vendor_id && (
              <button
                onClick={() => setShowVendorInfoForm(true)}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                この契約書で受注する
              </button>
            )}

            {/* クライアント承認待ち - クライアントが承認 */}
            {contract.status === 'pending_client_approval' && isClient && (
              <button
                onClick={handleApprove}
                className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                契約を締結する
              </button>
            )}

            {/* 契約締結済み */}
            {contract.status === 'signed' && (
              <div className="flex-1">
                <div className="text-center mb-4">
                  <p className="text-green-600 font-semibold">✓ 契約締結済み</p>
                  <p className="text-sm text-gray-600">
                    締結日: {new Date(contract.signed_at!).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {contract.pdf_url && (
                  <a
                    href={contract.pdf_url}
                    download={`contract-${contract.id}.pdf`}
                    className="block w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                  >
                    契約書PDFをダウンロード
                  </a>
                )}
              </div>
            )}

            {/* 編集ボタン（編集可能な場合） */}
            {canEdit && !isEditing && contract.status !== 'draft' && contract.status !== 'signed' && (
              <button
                onClick={handleEdit}
                className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                契約内容を編集
              </button>
            )}
          </div>
        </div>

        {/* ベンダー情報入力フォーム（モーダル） */}
        {showVendorInfoForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="rounded-lg bg-white p-8 shadow-xl max-w-md w-full">
              <h2 className="mb-4 text-xl font-bold">ベンダー情報の入力</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">氏名 *</label>
                  <input
                    type="text"
                    value={vendorInfo.name}
                    onChange={(e) => setVendorInfo({...vendorInfo, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">メールアドレス *</label>
                  <input
                    type="email"
                    value={vendorInfo.email}
                    onChange={(e) => setVendorInfo({...vendorInfo, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">住所</label>
                  <input
                    type="text"
                    value={vendorInfo.address}
                    onChange={(e) => setVendorInfo({...vendorInfo, address: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">電話番号</label>
                  <input
                    type="tel"
                    value={vendorInfo.phone}
                    onChange={(e) => setVendorInfo({...vendorInfo, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setShowVendorInfoForm(false)}
                  className="flex-1 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubmitVendorInfo}
                  className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  提出する
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
