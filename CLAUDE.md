# Claude Code 開発ルール

このプロジェクトのClaude Codeが開発時に遵守すべきルールを定義します。

---

## 言語ルール

**日本語必須**: Claude Codeは必ず日本語で応答すること。英語や他の言語での応答は禁止。

- ✅ **OK**: 「実装しました」「エラーが発生しました」
- ❌ **NG**: "Implemented", "Error occurred"
- **例外**: コード内のコメントは日本語、変数名・関数名は英語（キャメルケース等）

---

## プロジェクト構造とデプロイメントワークフロー

**重要**: このプロジェクトは2つの独立したディレクトリで構成されています。絶対に混同しないこと！

### ディレクトリ構造

#### 1. `/Users/unomasafumi/Desktop/Tasket/` - Cloudflare Workers（バックエンド）

**役割**: API・データベース・認証・決済処理

**主要ファイル**:
- `workers/` - API エンドポイント
  - `routes/ai.ts` - AI チャット・要件定義生成
  - `routes/projects.ts` - 案件管理
  - `routes/proposals.ts` - 提案管理
  - `routes/contracts.ts` - 契約書管理
  - `routes/payments.ts` - 決済処理
  - `routes/chat.ts` - チャット
  - `routes/reviews.ts` - レビュー
  - `routes/notifications.ts` - 通知
  - `routes/stripe-connect.ts` - Stripe Connect
- `middleware/auth.ts` - Firebase JWT 認証ミドルウェア
- `wrangler.toml` - Cloudflare Workers 設定
- `db/migrations/` - D1 データベースマイグレーション
- `db/schema.ts` - Drizzle ORM スキーマ定義

**デプロイメント方法**:
```bash
# 開発環境（ローカル）
cd /Users/unomasafumi/Desktop/Tasket
npx wrangler dev

# 本番環境
cd /Users/unomasafumi/Desktop/Tasket
npx wrangler deploy --env production
```

**Git リポジトリ**: https://github.com/zoopoko/tasket.git

**公開URL**: https://api.task-et.com

---

#### 2. `/Users/unomasafumi/Desktop/tasket-vite/` - Vite + React（フロントエンド）

**役割**: ユーザーインターフェース

**主要ファイル**:
- `src/pages/` - React Router ページコンポーネント
  - `auth/` - ログイン・サインアップ
  - `projects/` - 案件一覧・詳細・作成
  - `dashboard/` - ダッシュボード
  - `chat/` - チャット画面
  - `contracts/` - 契約書
  - `my-projects/` - マイプロジェクト
- `src/lib/` - ユーティリティ・認証・API クライアント
- `vite.config.ts` - Vite 設定
- `.env.local` - 環境変数（公開情報のみ）
- `public/` - 静的ファイル

**デプロイメント方法**:
```bash
# 開発環境（ローカル）
cd /Users/unomasafumi/Desktop/tasket-vite
npm run dev

# 本番環境（Cloudflare Pages - 自動デプロイ）
cd /Users/unomasafumi/Desktop/tasket-vite
git add .
git commit -m "コミットメッセージ"
git push origin master
# → Cloudflare Pages が自動でデプロイを開始

# 手動デプロイ（必要な場合のみ）
cd /Users/unomasafumi/Desktop/tasket-vite
npm run build
npx wrangler pages deploy dist --project-name=tasket
```

**Git リポジトリ**: https://github.com/zoopoko/tasket-vite.git

**公開URL**: https://task-et.com

---

### デプロイメント確認方法

#### フロントエンド（Cloudflare Pages）
1. https://dash.cloudflare.com/ にアクセス
2. Workers & Pages > `tasket` を選択
3. Deployments タブで最新のデプロイ履歴を確認
4. ブラウザで https://task-et.com にアクセスして動作確認

#### バックエンド（Cloudflare Workers）
1. https://dash.cloudflare.com/ にアクセス
2. Workers & Pages > `tasket-api` を選択
3. ブラウザの Network タブで API リクエストを確認
4. `wrangler tail` コマンドでリアルタイムログを確認

---

### 絶対に守るべきルール

1. **フロントエンドの変更**: 必ず `/Users/unomasafumi/Desktop/tasket-vite/` で作業
2. **バックエンドの変更**: 必ず `/Users/unomasafumi/Desktop/Tasket/` で作業
3. **デプロイ前の確認**: 現在のディレクトリを `pwd` コマンドで必ず確認
4. **環境変数の管理**:
   - フロントエンド: `.env.local` に `VITE_*` 変数のみ
   - バックエンド: Cloudflare Secrets に保存（絶対に`.env.local`に保存しない）

---

### よくある間違い

❌ **NG**: tasket-vite ディレクトリで `npx wrangler deploy`
✅ **OK**: Tasket ディレクトリで `npx wrangler deploy`

❌ **NG**: Tasket ディレクトリで `npm run dev` してフロントエンド起動を期待
✅ **OK**: tasket-vite ディレクトリで `npm run dev`

❌ **NG**: フロントエンドのコードを Tasket ディレクトリに配置
✅ **OK**: フロントエンドのコードは tasket-vite ディレクトリに配置

---

### デプロイメントチェックリスト

**フロントエンド変更時**:
- [ ] `cd /Users/unomasafumi/Desktop/tasket-vite`
- [ ] コード変更
- [ ] `npm run build` でビルドエラーがないか確認
- [ ] `git add . && git commit -m "メッセージ"`
- [ ] `git push origin master`
- [ ] Cloudflare Dashboard でデプロイ成功を確認

**バックエンド変更時**:
- [ ] `cd /Users/unomasafumi/Desktop/Tasket`
- [ ] コード変更
- [ ] `npx wrangler dev` でローカルテスト
- [ ] `npx wrangler deploy --env production`
- [ ] ブラウザの Network タブで API レスポンス確認

---

## クリーンアップルール

**不要なコード・ファイルは常に削除**: 機能を置き換えたり、統合したりする際は、古いコード・ファイルを必ず削除すること。

- ✅ **OK**: 新しいページに置き換えた後、古いページを削除
- ❌ **NG**: 古いページを残したまま新しいページを作成
- **理由**: コードベースの肥大化を防ぎ、メンテナンス性を保つ

**削除対象の例:**
- 使われなくなったページ・コンポーネント
- 統合されたAPI エンドポイント
- 置き換えられたユーティリティ関数
- テスト用の仮実装コード

### 削除前の安全確認プロセス

**削除する前に必ず以下を確認すること:**

1. **他の場所で使用されていないか確認**
   - Grepで import 文を検索
   - コンポーネント名・関数名で全文検索

2. **削除対象が明確か確認**
   - ファイル名が類似している場合は特に注意
   - パスを2回確認する

3. **ユーザーに報告**
   - 何を削除するか明示
   - 削除理由を説明
   - 削除実行前にユーザーの確認を得る

4. **削除が不確実な場合**
   - ユーザーに確認を求める
   - 「このファイルは他で使われていないので削除しても良いですか？」

**例:**
```
削除予定のファイル: /app/(main)/projects/new-with-ai/page.tsx
理由: /projects/new に統合済み
他の場所での使用: なし（Grep確認済み）

削除しても問題ないか確認させてください。
```

---

## 仕様変更管理ルール

### ドキュメントの優先順位（ソース・オブ・トゥルース）

1. **CLAUDE.md** - 最新の開発ルール（常に更新）
2. **README.md** - 最新の仕様（常に更新）
3. **要件定義書.txt** - 最初の要件（変更しない、履歴として保持）
4. **アプリケーション概要.txt** - 最初の概要（変更しない、履歴として保持）

### 原則

- 開発中に要件定義書やアプリケーション概要と異なる実装が必要になった場合、**必ずユーザーに報告・確認する**
- 勝手に判断して実装を変更しない

### 開発中に要件とのズレが発生した場合

1. **即座にユーザーに報告する**
2. 以下の情報を明確に説明する：
   - **どの要件がズレているか**
   - **なぜズレが発生したか**（技術的制約、パフォーマンス、セキュリティ、コストなど）
   - **提案する代替案**
   - **影響範囲**（他の機能への影響、工数の増減など）

### 報告フォーマット例

```
仕様のズレを検知しました：

【対象】
要件定義書.txt の「決済フロー」セクション

【現在の要件】
着手金30%と完了金70%を2回に分けて決済

【ズレの理由】
Stripe決済手数料が2回発生し、¥100,000案件で約¥7,200のコストがかかる

【提案】
エスクロー方式に変更
- 契約時に全額を決済（Stripe手数料1回のみ）
- プラットフォームに預かり、段階的に送金（送金手数料¥0）
- コスト削減: ¥7,200 → ¥3,600（約50%削減）

【影響範囲】
- API: /api/payments/deposit を変更
- API: /api/payments/transfer-deposit を新規作成
- API: /api/payments/completion を変更
- 工数: 追加作業なし（むしろシンプル化）
```

### 承認後の対応

1. **CHANGELOG.md**に変更を記録
2. **README.md**を更新
3. **CLAUDE.md**を更新（新しいルールを追加）
4. **元の要件定義書は変更しない**（履歴として保持）

---

## コーディングルール

### 1. TypeScript

- **必須**: すべてのコードはTypeScriptで記述
- **型定義**: `any`の使用は禁止。必ず適切な型を定義する
- **Strict Mode**: `tsconfig.json`で`strict: true`を設定

### 2. 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル | kebab-case | `user-profile.tsx` |
| コンポーネント | PascalCase | `UserProfile` |
| 関数・変数 | camelCase | `getUserData` |
| 定数 | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| 型・インターフェース | PascalCase | `UserProfile`, `ApiResponse` |
| DBテーブル | snake_case(複数形) | `users`, `projects` |
| DBカラム | snake_case | `created_at`, `user_id` |

### 3. コンポーネント設計

- **Server Components優先**: Next.js App Routerではデフォルトでサーバーコンポーネントを使用
- **Client Components**: 必要な場合のみ`'use client'`を明示
- **単一責任の原則**: 1つのコンポーネントは1つの責任のみを持つ
- **Props型定義**: すべてのPropsに型を定義

```typescript
// 良い例
interface UserCardProps {
  userId: string;
  name: string;
  email: string;
  onEdit?: () => void;
}

export function UserCard({ userId, name, email, onEdit }: UserCardProps) {
  // ...
}
```

### 4. エラーハンドリング

エラーレスポンスは統一形式で返す：

```typescript
return c.json({
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input',
    details: { field: 'email', reason: 'Invalid format' }
  }
}, 400);
```

**エラーコード一覧:**
- `VALIDATION_ERROR` (400): 入力値エラー
- `UNAUTHORIZED` (401): 認証エラー
- `FORBIDDEN` (403): 権限エラー
- `NOT_FOUND` (404): リソースが見つからない
- `INTERNAL_ERROR` (500): サーバーエラー

---

## Stripe Connect エスクロー決済ルール

### 決済方式

**エスクロー方式を採用:**
Stripe手数料を1回だけに抑えるため、全額を一括決済してプラットフォームに預かり、その後ベンダーに段階的に送金する。

### 決済フロー

```typescript
// 1. 契約時: 全額をエスクローに預かる
const totalAmount = proposal.budget;
const platformFee = Math.floor(totalAmount * 0.033);

await stripe.paymentIntents.create({
  amount: totalAmount,
  currency: 'jpy',
  // transfer_dataを指定しない = プラットフォームに入金
  metadata: {
    proposal_id: proposalId,
    payment_type: 'escrow',
  },
});

// 2. 開発開始時: ベンダーに30%を送金（送金手数料¥0）
const depositAmount = Math.floor(totalAmount * 0.3);
const depositPlatformFee = Math.floor(depositAmount * 0.033);
const depositTransfer = depositAmount - depositPlatformFee;

await stripe.transfers.create({
  amount: depositTransfer,
  currency: 'jpy',
  destination: vendorStripeAccountId,
});

// 3. 完了時: ベンダーに70%を送金（送金手数料¥0）
const completionAmount = Math.floor(totalAmount * 0.7);
const completionPlatformFee = Math.floor(completionAmount * 0.033);
const completionTransfer = completionAmount - completionPlatformFee;

await stripe.transfers.create({
  amount: completionTransfer,
  currency: 'jpy',
  destination: vendorStripeAccountId,
});
```

### コスト削減効果

- **Before（2回決済）**: Stripe手数料2回（¥100,000案件で約¥7,200）
- **After（エスクロー）**: Stripe手数料1回（¥100,000案件で約¥3,600）
- **削減率**: 約50%

### 重要な制約

- **type**: 必ず`'standard'`を指定
- **プラットフォーム手数料**: 3.3%固定
- **送金手数料**: ¥0（Stripe Transferは無料）
- **エスクロー**: 全額を一括決済してプラットフォームに預かる
- **段階送金**: Transfer APIで30%→70%の順に送金

---

## データベース設計ルール

### テーブル命名

- **複数形**: `users`, `projects`, `proposals`
- **スネークケース**: `created_at`, `user_id`

### 必須カラム

すべてのテーブルに以下を含める：
- `id`: プライマリーキー（UUID推奨）
- `created_at`: 作成日時（timestamp）
- `updated_at`: 更新日時（timestamp）

### 外部キー

- **命名**: `{table}_id`（例: `user_id`, `project_id`）
- **制約**: 必ずON DELETE、ON UPDATEを指定

---

## セキュリティルール

### 認証・認可

- **認証**: すべてのAPI呼び出しでトークン検証
- **認可**: リソースへのアクセス権限を必ず確認

### 入力検証

- **フロント**: Zodでバリデーション
- **バック**: 再度バリデーション（二重チェック）
- **サニタイズ**: XSS対策のため、ユーザー入力を適切にエスケープ

### 環境変数とシークレット管理

**重要**: シークレットキーは絶対に`.env.local`に保存しない！

#### フロントエンド（Next.js）
- **公開情報のみ**: `NEXT_PUBLIC_*` プレフィックス
- **保存場所**: `.env.local`（Gitにコミットしない）
- **例**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

#### バックエンド（Cloudflare Workers）
- **シークレットキー**: Cloudflare Dashboard の Secrets に保存
- **絶対に禁止**: `.env.local`にシークレットキーを保存すること
- **設定方法**:
  ```bash
  # Cloudflare Secretsに設定
  npx wrangler secret put STRIPE_SECRET_KEY
  npx wrangler secret put GOOGLE_GEMINI_API_KEY
  npx wrangler secret put FIREBASE_PRIVATE_KEY
  ```

#### セキュリティルール
- ✅ **OK**: 公開可能な情報を`.env.local`に保存
- ❌ **NG**: シークレットキーを`.env.local`に保存
- ✅ **必須**: シークレットキーはCloudflare Secretsに保存
- ✅ **必須**: `.env.example`には実際の値を書かない（プレースホルダーのみ）

#### 環境変数の種類

| 種類 | 保存場所 | 例 |
|------|---------|-----|
| 公開情報 | `.env.local` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| シークレット | Cloudflare Secrets | `STRIPE_SECRET_KEY` |
| テンプレート | `.env.example` | `STRIPE_SECRET_KEY=your_secret_key_here` |

---

## 禁止事項

- `any`の使用
- SQLの直接実行
- 環境変数のハードコード
- 機密情報のコミット
- 認証チェックの省略
- エラーハンドリングの省略
- コメントなしの複雑な処理

---

## プロジェクトの哲学

### プラットフォームの目的

- **超低コスト運営**: 月¥200-500で運営可能な設計
- **完全自動化**: 手作業ゼロを目指す
- **三方良し**: クライアント、ベンダー、プラットフォーム運営者すべてにメリット

### 差別化ポイント

- **業界最安の手数料**: 3.3%（競合は20%）
- **AI要件定義支援**: 技術に詳しくなくても簡単に依頼できる
- **透明な料金体系**: 手数料を明示

---

## 参考リンク

- Next.js: https://nextjs.org/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Stripe Connect: https://stripe.com/docs/connect
- Firebase Auth: https://firebase.google.com/docs/auth
- Gemini API: https://ai.google.dev/docs
