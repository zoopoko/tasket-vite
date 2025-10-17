// 静的エクスポート用: generateStaticParams() はサーバーコンポーネントで定義
export function generateStaticParams() {
  return [];
}

// クライアントコンポーネントを動的import
export { default } from './PageClient';
