
/**
 * Stripe Connect接続ページ（ベンダー向け）
 * ベンダーがStripeアカウントを接続して支払いを受け取れるようにする
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate } from 'react-router-dom';

export default function ConnectStripePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    connected: boolean;
    accountId?: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        const token = await user?.getIdToken();

        const response = await fetch('/api/stripe/status', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStripeStatus(data);
        }
      } catch (error) {
        console.error('Stripe status fetch error:', error);
      }
    };

    if (user) {
      fetchStripeStatus();
    }
  }, [user]);

  const handleConnectStripe = async () => {
    setConnecting(true);

    try {
      const token = await user?.getIdToken();

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Stripe接続に失敗しました');
      }

      const data = await response.json();

      // Stripeのオンボーディングページにリダイレクト
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Connect Stripe error:', error);
      alert(error.message || 'Stripe接続に失敗しました');
      setConnecting(false);
    }
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Stripe Connect 接続
            </h1>
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
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow">
          {stripeStatus?.connected ? (
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Stripeアカウント接続済み
                  </h2>
                  <p className="text-sm text-gray-600">
                    アカウントID: {stripeStatus.accountId}
                  </p>
                </div>
              </div>

              <div className="rounded-md bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  Stripeアカウントが正常に接続されています。
                  <br />
                  案件の支払いを受け取る準備ができています。
                </p>
              </div>

              <div className="mt-6">
                <Link
                  to="/dashboard"
                  className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                >
                  ダッシュボードに戻る
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                支払いを受け取るためにStripeアカウントを接続
              </h2>

              <div className="mt-6 space-y-4">
                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="text-sm font-semibold text-blue-900">
                    Stripe Connectとは？
                  </h3>
                  <p className="mt-2 text-sm text-blue-700">
                    Stripe Connectは、プラットフォームを通じて安全に支払いを受け取るためのシステムです。
                    クライアントからの支払いを直接あなたのStripeアカウントで受け取ることができます。
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">接続の流れ</h3>
                  <ol className="list-inside list-decimal space-y-2 text-sm text-gray-700">
                    <li>下記のボタンをクリックしてStripeのページに移動</li>
                    <li>Stripeアカウントを作成またはログイン</li>
                    <li>必要な情報（銀行口座、本人確認書類など）を入力</li>
                    <li>接続完了後、自動的にダッシュボードに戻ります</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">手数料について</h3>
                  <div className="text-sm text-gray-700">
                    <p>プラットフォーム手数料: 3.3%（業界最安）</p>
                    <p className="mt-1 text-xs text-gray-500">
                      ※ Stripe決済手数料は無料です（プラットフォームが負担）
                    </p>
                  </div>
                </div>

                <div className="rounded-md bg-yellow-50 p-4">
                  <h3 className="text-sm font-semibold text-yellow-900">
                    重要事項
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-700">
                    <li>本人確認書類（免許証、パスポート等）が必要です</li>
                    <li>銀行口座情報の入力が必要です</li>
                    <li>審査に1-2営業日かかる場合があります</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="w-full rounded-md bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {connecting
                    ? 'Stripeに接続中...'
                    : 'Stripeアカウントを接続'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
