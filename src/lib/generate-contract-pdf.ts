/**
 * 契約書PDF生成ユーティリティ
 * 方法1: html2canvas + jsPDF（画像としてPDF化）
 * 方法2: ブラウザの印刷機能（よりシンプルで安定）
 */
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * ブラウザの印刷機能を使ってPDFを生成する（推奨）
 * @param element - PDF化するHTMLエレメント
 */
export function printContractToPDF(element: HTMLElement): void {
  // 印刷用のスタイルを一時的に追加
  const printStyle = document.createElement('style');
  printStyle.textContent = `
    @media print {
      body * {
        visibility: hidden;
      }
      #contract-print-area, #contract-print-area * {
        visibility: visible;
      }
      #contract-print-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `;
  document.head.appendChild(printStyle);

  // エレメントにIDを一時的に追加
  const originalId = element.id;
  element.id = 'contract-print-area';

  // 印刷ダイアログを開く
  window.print();

  // クリーンアップ
  setTimeout(() => {
    element.id = originalId;
    document.head.removeChild(printStyle);
  }, 100);
}

/**
 * HTMLエレメントからPDFを生成する
 * @param element - PDF化するHTMLエレメント
 * @param filename - ファイル名
 */
export async function downloadContractPDFFromElement(
  element: HTMLElement,
  filename: string = 'contract.pdf'
): Promise<void> {
  try {
    console.log('PDF生成開始:', element);

    // HTMLをキャンバスに変換
    console.log('html2canvas開始...');
    const canvas = await html2canvas(element, {
      scale: 2, // 高画質化
      useCORS: true,
      logging: true,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });
    console.log('html2canvas完了:', canvas);

    const imgData = canvas.toDataURL('image/png');
    console.log('画像データ取得完了');

    const imgWidth = 210; // A4の幅（mm）
    const pageHeight = 297; // A4の高さ（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // PDFドキュメントを作成
    console.log('PDF作成開始...');
    const pdf = new jsPDF('p', 'mm', 'a4');

    // 1ページ目を追加
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 2ページ目以降を追加（必要な場合）
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    console.log('PDF保存中...');
    // PDFをダウンロード
    pdf.save(filename);
    console.log('PDF保存完了');
  } catch (error) {
    console.error('PDF生成エラー詳細:', error);
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    }
    throw new Error(`PDFの生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
  }
}

// 下位互換性のため、旧関数を残す（ただし非推奨）
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
 * @deprecated downloadContractPDFFromElement を使用してください
 */
export function downloadContractPDF(
  _contract: ContractData,
  _filename?: string
): void {
  console.warn('downloadContractPDF は非推奨です。downloadContractPDFFromElement を使用してください。');
}
