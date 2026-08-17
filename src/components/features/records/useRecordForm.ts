import { useState } from "react";
import { LifeRecord } from "@/types";

export const useRecordForm = () => {
    const [formData, setFormData] = useState<LifeRecord>({
        date: new Date().toISOString().split("T")[0],
        wakeUpTime: "07:00",
        sleepTime: "23:00",
        condition: 3,
        memo: "",
    });

    // 送信中のローディング状態を管理するフラグ
    const [loading, setLoading] = useState(false);

    const handleChange = (field: keyof LifeRecord, value: string | number) => {
        setFormData((prev) => ({
        ...prev,
        [field]: value,
        }));
    };

    // フォーム送信処理（API呼び出し）
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
        // 1. 作成した Next.js の API (route.ts) へデータを送信
        const response = await fetch("/api/records", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
            alert("スプレッドシートへの保存が完了しました！🎉");
            // 送信後にメモ欄をクリアするなどの調整も可能
        } else {
            alert(`保存に失敗しました: ${result.error}`);
        }
        } catch (error) {
        console.error("送信エラー:", error);
        alert("通信エラーが発生しました。");
        } finally {
        setLoading(false);
        }
    };

    return {
        formData,
        loading,
        handleChange,
        handleSubmit,
    };
};