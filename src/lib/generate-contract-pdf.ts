/**
 * 契約書PDF生成ユーティリティ
 * jsPDFを使用して契約書をPDF形式で生成
 */
import { jsPDF } from 'jspdf';

type ContractData = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  budget: number;
  deadline_days: number;
  client_name: string;
  client_email: string;
  client_address?: string;
  client_phone?: string;
  vendor_name: string;
  vendor_email: string;
  vendor_address?: string;
  vendor_phone?: string;
  terms: string;
  payment_terms: string;
  deliverables: string;
  status: string;
  created_at: string;
  signed_at?: string;
};

/**
 * 契約書PDFを生成する
 * @param contract - 契約書データ
 * @returns PDF Blob
 */
export function generateContractPDF(contract: ContractData): Blob {
  // A4サイズのPDFを作成
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // 基本設定
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  // フォントサイズ設定
  const titleFontSize = 18;
  const headingFontSize = 14;
  const bodyFontSize = 11;
  const smallFontSize = 9;

  // ヘッダー: タイトル
  doc.setFontSize(titleFontSize);
  doc.text('業務委託契約書', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // 契約ID・日付
  doc.setFontSize(smallFontSize);
  doc.text(`契約ID: ${contract.id}`, margin, yPosition);
  yPosition += 5;
  doc.text(
    `作成日: ${new Date(contract.created_at).toLocaleDateString('ja-JP')}`,
    margin,
    yPosition
  );
  if (contract.signed_at) {
    yPosition += 5;
    doc.text(
      `締結日: ${new Date(contract.signed_at).toLocaleDateString('ja-JP')}`,
      margin,
      yPosition
    );
  }
  yPosition += 10;

  // 区切り線
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // 契約当事者情報
  doc.setFontSize(headingFontSize);
  doc.text('第1条 契約当事者', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(bodyFontSize);

  // クライアント情報
  doc.text('【発注者（クライアント）】', margin, yPosition);
  yPosition += 6;
  doc.setFontSize(smallFontSize);
  doc.text(`氏名: ${contract.client_name}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`メールアドレス: ${contract.client_email}`, margin + 5, yPosition);
  yPosition += 5;
  if (contract.client_address) {
    doc.text(`住所: ${contract.client_address}`, margin + 5, yPosition);
    yPosition += 5;
  }
  if (contract.client_phone) {
    doc.text(`電話番号: ${contract.client_phone}`, margin + 5, yPosition);
    yPosition += 5;
  }
  yPosition += 5;

  // ベンダー情報
  doc.setFontSize(bodyFontSize);
  doc.text('【受注者（ベンダー）】', margin, yPosition);
  yPosition += 6;
  doc.setFontSize(smallFontSize);
  doc.text(`氏名: ${contract.vendor_name}`, margin + 5, yPosition);
  yPosition += 5;
  doc.text(`メールアドレス: ${contract.vendor_email}`, margin + 5, yPosition);
  yPosition += 5;
  if (contract.vendor_address) {
    doc.text(`住所: ${contract.vendor_address}`, margin + 5, yPosition);
    yPosition += 5;
  }
  if (contract.vendor_phone) {
    doc.text(`電話番号: ${contract.vendor_phone}`, margin + 5, yPosition);
    yPosition += 5;
  }
  yPosition += 10;

  // 業務内容
  doc.setFontSize(headingFontSize);
  doc.text('第2条 業務内容', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(bodyFontSize);
  doc.text(`案件名: ${contract.title}`, margin, yPosition);
  yPosition += 6;

  doc.setFontSize(smallFontSize);
  const descriptionLines = doc.splitTextToSize(
    `説明: ${contract.description}`,
    contentWidth
  );
  doc.text(descriptionLines, margin, yPosition);
  yPosition += descriptionLines.length * 5 + 5;

  // 新しいページが必要か確認
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  // 報酬
  doc.setFontSize(headingFontSize);
  doc.text('第3条 報酬', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(bodyFontSize);
  doc.text(
    `業務委託料: ${contract.budget.toLocaleString('ja-JP')}円（税込）`,
    margin,
    yPosition
  );
  yPosition += 6;

  doc.setFontSize(smallFontSize);
  const platformFee = Math.floor(contract.budget * 0.033);
  doc.text(
    `プラットフォーム手数料（3.3%）: ${platformFee.toLocaleString('ja-JP')}円`,
    margin,
    yPosition
  );
  yPosition += 5;
  doc.text(
    `ベンダー受取額: ${(contract.budget - platformFee).toLocaleString('ja-JP')}円`,
    margin,
    yPosition
  );
  yPosition += 10;

  // 支払条件
  if (contract.payment_terms) {
    const paymentLines = doc.splitTextToSize(
      `支払条件: ${contract.payment_terms}`,
      contentWidth
    );
    doc.text(paymentLines, margin, yPosition);
    yPosition += paymentLines.length * 5 + 10;
  }

  // 納期
  doc.setFontSize(headingFontSize);
  doc.text('第4条 納期', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(bodyFontSize);
  doc.text(`納期: 契約締結日から${contract.deadline_days}日以内`, margin, yPosition);
  yPosition += 10;

  // 新しいページが必要か確認
  if (yPosition > pageHeight - 50) {
    doc.addPage();
    yPosition = margin;
  }

  // 成果物
  if (contract.deliverables) {
    doc.setFontSize(headingFontSize);
    doc.text('第5条 成果物', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(smallFontSize);
    const deliverablesLines = doc.splitTextToSize(
      contract.deliverables,
      contentWidth
    );
    doc.text(deliverablesLines, margin, yPosition);
    yPosition += deliverablesLines.length * 5 + 10;
  }

  // 契約条件
  if (contract.terms) {
    doc.setFontSize(headingFontSize);
    doc.text('第6条 その他の条件', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(smallFontSize);
    const termsLines = doc.splitTextToSize(contract.terms, contentWidth);
    doc.text(termsLines, margin, yPosition);
    yPosition += termsLines.length * 5 + 10;
  }

  // 新しいページが必要か確認
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  // フッター: 署名欄
  yPosition = pageHeight - 50;
  doc.setFontSize(bodyFontSize);
  doc.text('以上、本契約の成立を証するため、本書を2通作成し、', margin, yPosition);
  yPosition += 6;
  doc.text('甲乙各1通を保有する。', margin, yPosition);
  yPosition += 15;

  // 署名欄
  doc.text('発注者（甲）: __________________', margin, yPosition);
  doc.text(
    '受注者（乙）: __________________',
    pageWidth / 2 + 10,
    yPosition
  );

  // ステータス表示
  yPosition += 10;
  doc.setFontSize(smallFontSize);
  let statusText = '';
  switch (contract.status) {
    case 'draft':
      statusText = '【下書き】';
      break;
    case 'published':
      statusText = '【公開済み】';
      break;
    case 'pending_vendor_approval':
      statusText = '【ベンダー確認待ち】';
      break;
    case 'pending_client_approval':
      statusText = '【クライアント承認待ち】';
      break;
    case 'signed':
      statusText = '【契約締結済み】';
      break;
  }
  doc.text(`契約状況: ${statusText}`, margin, yPosition);

  // PDFをBlobとして返す
  return doc.output('blob');
}

/**
 * 契約書PDFをダウンロードする
 * @param contract - 契約書データ
 * @param filename - ファイル名（オプション）
 */
export function downloadContractPDF(
  contract: ContractData,
  filename?: string
): void {
  const blob = generateContractPDF(contract);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =
    filename ||
    `contract_${contract.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
