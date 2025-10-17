/**
 * メール送信サービス
 * Resendを使用してメール通知を送信
 */
import { Resend } from 'resend';

// Resendインスタンス（環境変数からAPIキーを取得）
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set in environment variables');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * メールを送信する
 */
export async function sendEmail({ to, subject, html, from }: EmailParams): Promise<void> {
  try {
    const resendClient = getResend();

    await resendClient.emails.send({
      from: from || 'Tasket <noreply@tasket.dev>',
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // メール送信失敗はログに記録するが、エラーをスローしない
    // （メール送信失敗でもメイン処理は継続させる）
  }
}

/**
 * 提案受信メールを送信
 */
export async function sendProposalReceivedEmail(params: {
  to: string;
  clientName: string;
  vendorName: string;
  projectTitle: string;
  projectId: string;
  proposalMessage: string;
}): Promise<void> {
  const { to, clientName, vendorName, projectTitle, projectId, proposalMessage } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📩 新しい提案が届きました</h1>
          </div>
          <div class="content">
            <p>こんにちは、${clientName}さん</p>
            <p><strong>${vendorName}</strong>さんから、案件「<strong>${projectTitle}</strong>」に提案が届きました。</p>

            <h3>提案メッセージ:</h3>
            <p style="background-color: white; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
              ${proposalMessage}
            </p>

            <p>提案の詳細を確認し、承認または拒否を行ってください。</p>

            <a href="http://localhost:3000/my-projects/${projectId}/proposals" class="button">
              提案を確認する
            </a>
          </div>
          <div class="footer">
            <p>このメールは Tasket から自動送信されています。</p>
            <p>&copy; 2025 Tasket. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `【Tasket】新しい提案が届きました - ${projectTitle}`,
    html,
  });
}

/**
 * 提案承認メールを送信
 */
export async function sendProposalAcceptedEmail(params: {
  to: string;
  vendorName: string;
  clientName: string;
  projectTitle: string;
  projectId: string;
}): Promise<void> {
  const { to, vendorName, clientName, projectTitle, projectId } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ 提案が承認されました！</h1>
          </div>
          <div class="content">
            <p>こんにちは、${vendorName}さん</p>
            <p>おめでとうございます！<strong>${clientName}</strong>さんが、案件「<strong>${projectTitle}</strong>」への提案を承認しました。</p>

            <p>これから案件が開始されます。クライアントとチャットでやり取りしながら、プロジェクトを進めてください。</p>

            <a href="http://localhost:3000/projects/${projectId}" class="button">
              案件詳細を確認する
            </a>
          </div>
          <div class="footer">
            <p>このメールは Tasket から自動送信されています。</p>
            <p>&copy; 2025 Tasket. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `【Tasket】提案が承認されました - ${projectTitle}`,
    html,
  });
}

/**
 * 提案拒否メールを送信
 */
export async function sendProposalRejectedEmail(params: {
  to: string;
  vendorName: string;
  projectTitle: string;
}): Promise<void> {
  const { to, vendorName, projectTitle } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ 提案が拒否されました</h1>
          </div>
          <div class="content">
            <p>こんにちは、${vendorName}さん</p>
            <p>残念ながら、案件「<strong>${projectTitle}</strong>」への提案は採用されませんでした。</p>

            <p>他にも多くの案件が公開されています。引き続き、あなたのスキルに合った案件を探してみてください。</p>

            <a href="http://localhost:3000/projects" class="button">
              他の案件を探す
            </a>
          </div>
          <div class="footer">
            <p>このメールは Tasket から自動送信されています。</p>
            <p>&copy; 2025 Tasket. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `【Tasket】提案について - ${projectTitle}`,
    html,
  });
}

/**
 * 新規メッセージ通知メールを送信
 */
export async function sendNewMessageEmail(params: {
  to: string;
  recipientName: string;
  senderName: string;
  projectTitle: string;
  projectId: string;
  messagePreview: string;
}): Promise<void> {
  const { to, recipientName, senderName, projectTitle, projectId, messagePreview } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 新しいメッセージが届きました</h1>
          </div>
          <div class="content">
            <p>こんにちは、${recipientName}さん</p>
            <p><strong>${senderName}</strong>さんから、案件「<strong>${projectTitle}</strong>」のチャットに新しいメッセージが届きました。</p>

            <h3>メッセージプレビュー:</h3>
            <p style="background-color: white; padding: 15px; border-left: 4px solid #8b5cf6; border-radius: 4px;">
              ${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? '...' : ''}
            </p>

            <a href="http://localhost:3000/projects/${projectId}/chat" class="button">
              チャットを開く
            </a>
          </div>
          <div class="footer">
            <p>このメールは Tasket から自動送信されています。</p>
            <p>&copy; 2025 Tasket. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `【Tasket】新しいメッセージ - ${projectTitle}`,
    html,
  });
}

/**
 * レビュー投稿通知メールを送信
 */
export async function sendReviewReceivedEmail(params: {
  to: string;
  recipientName: string;
  reviewerName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { to, recipientName, reviewerName, rating, comment } = params;

  const stars = '⭐'.repeat(rating);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⭐ 新しいレビューが投稿されました</h1>
          </div>
          <div class="content">
            <p>こんにちは、${recipientName}さん</p>
            <p><strong>${reviewerName}</strong>さんから、新しいレビューが投稿されました。</p>

            <h3>評価: ${stars}</h3>
            <p style="background-color: white; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px;">
              ${comment}
            </p>

            <a href="http://localhost:3000/profile" class="button">
              プロフィールを確認する
            </a>
          </div>
          <div class="footer">
            <p>このメールは Tasket から自動送信されています。</p>
            <p>&copy; 2025 Tasket. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: `【Tasket】新しいレビューが投稿されました`,
    html,
  });
}
