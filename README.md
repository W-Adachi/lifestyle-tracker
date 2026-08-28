# 生活リズム管理アプリ (Lifestyle Tracker)

復職に向けた生活リズム（睡眠・体調・活動）を記録・可視化するためのWebアプリケーションです。

## 📁 実務を意識したフォルダ構成（関心の分離）

このプロジェクトでは、コードの可読性・保守性を高めるため、**「HTML（構造）」「CSS（デザイン）」「TS（ロジック）」を3つのファイルに分離**して管理しています。

```text
lifestyle-tracker/
├── public/                 ※初期生成のSVG画像（そのままでOK）
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── records/
│   │   │       └── route.ts         ★スプレッドシートAPI（GET/POST）
│   │   ├── records/
│   │   │   └── page.tsx             ★履歴・グラフ・PDF出力画面 (/records)
│   │   ├── globals.css              ★全体スタイル＆PDF印刷用CSS
│   │   ├── layout.tsx               ★アプリ共通レイアウト
│   │   └── page.tsx                 ★入力画面 (/) ※トップページ
│   │
│   ├── components/
│   │   └── features/
│   │       └── record-form/         ※フォルダ名「record-form」で統一
│   │           ├── RecordForm.module.css
│   │           ├── RecordForm.tsx   ★入力フォーム本体
│   │           └── useRecordForm.ts ★フォーム状態・送信ロジック
│   │
│   └── types/
│       └── index.ts                 ※共通型定義（あれば使用）
│
├── .env.local                       ★環境変数（GOOGLE_...）
└── (その他設定ファイル群)            ※package.json, tsconfig.json 等
```

## 🛠 使用技術（Tech Stack）

  ・Framework: Next.js (App Router)
  ・Language: TypeScript
  ・Style: CSS Modules
  ・Deployment: Vercel


## 📝 開発時の学び・メモ

CSS Modulesの採用理由: 1ファイルにクラス名やスタイルが溢れるのを防ぎ、従来の「見た目の分離」と「保守性の向上」を両立するため。

カスタムフック (useRecordForm): 画面の見た目（JSX）から状態管理（useState）や送信処理のロジックを切り離し、役割を明確化。


