# 生活リズム管理アプリ (Lifestyle Tracker)

復職に向けた生活リズム（睡眠・体調・活動）を記録・可視化するためのWebアプリケーションです。

## 📁 実務を意識したフォルダ構成（関心の分離）

このプロジェクトでは、コードの可読性・保守性を高めるため、**「HTML（構造）」「CSS（デザイン）」「TS（ロジック）」を3つのファイルに分離**して管理しています。

```text
lifestyle-tracker/
├── src/
│   ├── app/                      # ページとルーティング (Next.js App Router)
│   │   ├── layout.tsx            # 全体共通レイアウト
│   │   ├── page.tsx              # トップ画面
│   │   └── api/
│   │       └── records/          # [Step 3で実装予定] データ保存・取得API
│   │           └── route.ts
│   │
│   ├── components/
│   │   └── features/             # 機能別コンポーネント
│   │       └── records/          # 生活記録フォーム機能
│   │           ├── RecordForm.tsx        # 【役割1：構造】HTML (JSX) の組み立て
│   │           ├── RecordForm.module.css # 【役割2：デザイン】CSS Moduleによるスタイル定義
│   │           └── useRecordForm.ts      # 【役割3：ロジック】カスタムフックによる状態・処理管理
│   │
│   └── types/                    # TypeScriptの型定義
│       └── index.ts              # LifeRecord型（日付、睡眠時間、体調など）
│
└── tsconfig.json                 # エイリアス設定 ("@/*": ["./src/*"])
```

## 🛠 使用技術（Tech Stack）

  ・Framework: Next.js (App Router)
  ・Language: TypeScript
  ・Style: CSS Modules
  ・Deployment: Vercel


## 📝 開発時の学び・メモ

CSS Modulesの採用理由: 1ファイルにクラス名やスタイルが溢れるのを防ぎ、従来の「見た目の分離」と「保守性の向上」を両立するため。

カスタムフック (useRecordForm): 画面の見た目（JSX）から状態管理（useState）や送信処理のロジックを切り離し、役割を明確化。


