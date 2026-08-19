# 生活リズム管理アプリ (Lifestyle Tracker)

復職に向けた生活リズム（睡眠・体調・活動）を記録・可視化するためのWebアプリケーションです。

## 📁 実務を意識したフォルダ構成（関心の分離）

このプロジェクトでは、コードの可読性・保守性を高めるため、**「HTML（構造）」「CSS（デザイン）」「TS（ロジック）」を3つのファイルに分離**して管理しています。

```text
lifestyle-tracker/
├── app/
│   ├── layout.tsx            # 全体共通のレイアウト（ヘッダー/フッターなど）
│   ├── page.tsx              # トップページ（/）：入力フォーム専用
│   ├── records/
│   │   └── page.tsx          # 履歴一覧ページ（/records）：一覧テーブル表示
│   └── api/
│       └── records/
│           └── route.ts      # APIエンドポイント（POST: 保存 / GET: 取得）
├── components/
│   ├── RecordForm.tsx        # 入力フォームコンポーネント
│   ├── RecordTable.tsx       # 履歴テーブルコンポーネント（切り出すとさらにスッキリ！）
│   └── Navigation.tsx        # ページ移動用ナビゲーション（任意）
├── types/
│   └── index.ts              # 型定義（RecordItem など）
└── public/
```

## 🛠 使用技術（Tech Stack）

  ・Framework: Next.js (App Router)
  ・Language: TypeScript
  ・Style: CSS Modules
  ・Deployment: Vercel


## 📝 開発時の学び・メモ

CSS Modulesの採用理由: 1ファイルにクラス名やスタイルが溢れるのを防ぎ、従来の「見た目の分離」と「保守性の向上」を両立するため。

カスタムフック (useRecordForm): 画面の見た目（JSX）から状態管理（useState）や送信処理のロジックを切り離し、役割を明確化。


