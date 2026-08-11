import { useState } from "react";
import { LifeRecord } from "@/types";

// カスタムフック：ロジック（データの状態と処理）だけをコンポーネントから分離する関数
export const useRecordForm = () => {
    // 1. 状態（State）の定義
    // useState<LifeRecord>(...) の <LifeRecord> は「ジェネリクス（Generics）」と呼ばれる型指定です。
    // 「この formData には LifeRecord 型のデータしか入りません」と宣言しています。    
    const [formData, setFormData] = useState<LifeRecord>({
        date: new Date().toISOString().split("T")[0],
        wakeUpTime: "07:00",
        sleepTime: "23:00",
        condition: 3,
        memo: "",
    });

    // 2. データ変更ハンドラー
    // field: keyof LifeRecord ➔ "date" | "wakeUpTime" | "sleepTime" | "condition" | "memo" のいずれかしか受け付けない安全な引数
    const handleChange = (field: keyof LifeRecord, value: string | number) => {
        // setFormData((prev) => ...) ➔ 直前の状態（prev）を元に新しい状態を作る
        setFormData((prev) => ({
        ...prev,    // スプレッド構文：前のデータを丸ごとコピー（非破壊的更新）
        [field]: value, // 変更したい項目（例: "memo"）だけを新しい値（value）で上書き
        }));
    };

    // 3. フォーム送信時の処理
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault(); // フォーム送信時にページ全体がリロードされるデフォルト動作をキャンセル
        console.log("送信されたデータ:", formData);
        alert("フォームが送信されました！（コンソールでデータを確認できます）");
    };

    // 4. コンポーネント（見た目側）へ渡す値をまとめて返却（return）する
    return {
        formData,
        handleChange,
        handleSubmit,
    };
};