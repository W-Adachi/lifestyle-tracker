"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecordItem {
    id: number;
    date: string;
    wake_time: string;
    bed_time: string;
    sleep_quality: string;
    created_at: string;
    }

    export default function RecordsPage() {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const fetchRecords = async () => {
        setLoading(true);
        try {
        const res = await fetch("/api/lifestyle-records", {
            cache: "no-store", // 常に最新データを取得
        });
        if (!res.ok) {
            throw new Error("データの取得に失敗しました");
        }
        const data = await res.json();
        setRecords(data);
        } catch (err: any) {
        setError(err.message || "エラーが発生しました");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h1>生活記録一覧</h1>
        <div style={{ marginBottom: "20px" }}>
            <Link href="/" style={{ marginRight: "10px" }}>
            ← 入力画面へ戻る
            </Link>
            <button onClick={fetchRecords} style={{ padding: "5px 10px" }}>
            手動更新
            </button>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && records.length === 0 && <p>記録がまだありません。</p>}

        <ul style={{ listStyle: "none", padding: 0 }}>
            {records.map((rec) => (
            <li
                key={rec.id}
                style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "10px",
                }}
            >
                <strong>日付: {rec.date}</strong>
                <div>就寝: {rec.bed_time} / 起床: {rec.wake_time}</div>
                <div>睡眠の質: {rec.sleep_quality}</div>
            </li>
            ))}
        </ul>
        </div>
    );
}