"use client";

import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    } from "recharts";

    type RecordType = {
    id: number;
    date: string;
    wakeTime: string;
    bedTime: string;
    mood: string;
    memo: string;
    };

    export default function RecordsPage() {
    const [records, setRecords] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/records")
        .then((res) => res.json())
        .then((data) => {
            setRecords(data.records || []);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    }, []);

    const calculateSleepHours = (bed: string, wake: string) => {
        if (!bed || !wake) return null;
        const [bH, bM] = bed.split(":").map(Number);
        const [wH, wM] = wake.split(":").map(Number);
        if (isNaN(bH) || isNaN(wH)) return null;

        let bedMin = bH * 60 + (bM || 0);
        let wakeMin = wH * 60 + (wM || 0);
        if (wakeMin < bedMin) wakeMin += 24 * 60;

        return Number(((wakeMin - bedMin) / 60).toFixed(1));
    };

    const chartData = records
        .slice()
        .reverse()
        .map((r) => ({
        date: r.date.slice(5),
        sleepHours: calculateSleepHours(r.bedTime, r.wakeTime),
        mood: Number(r.mood) || null,
        }));

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <p style={{ padding: "20px" }}>読み込み中...</p>;

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        {/* 印刷時に隠すエリア */}
        <div className="no-print" style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a
            href="/"
            style={{
                padding: "8px 14px",
                backgroundColor: "#e5e7eb",
                color: "#374151",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "0.9rem",
            }}
            >
            ← 入力画面へ戻る
            </a>
            
            <button
            onClick={handlePrint}
            style={{
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
            }}
            >
            📄 PDFで保存・印刷する
            </button>
        </div>

        <h2>生活リズム記録レポート</h2>

        {/* グラフエリア */}
        <div style={{ marginBottom: "40px", backgroundColor: "#fff", padding: "15px", borderRadius: "8px", border: "1px solid #ddd" }}>
            <h3 style={{ marginTop: 0 }}>睡眠時間 & 気分の推移</h3>
            <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[0, 12]} label={{ value: "睡眠時間(h)", angle: -90, position: "insideLeft" }} />
                <YAxis yAxisId="right" orientation="right" domain={[1, 5]} label={{ value: "気分(1-5)", angle: 90, position: "insideRight" }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="sleepHours" name="睡眠時間(時間)" stroke="#2563eb" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="mood" name="気分" stroke="#16a34a" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* 一覧テーブル */}
        <div>
            <h3>記録一覧</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "8px" }}>日付</th>
                <th style={{ padding: "8px" }}>起床時間</th>
                <th style={{ padding: "8px" }}>就寝時間</th>
                <th style={{ padding: "8px" }}>気分</th>
                <th style={{ padding: "8px" }}>メモ</th>
                </tr>
            </thead>
            <tbody>
                {records.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{r.date}</td>
                    <td style={{ padding: "8px" }}>{r.wakeTime}</td>
                    <td style={{ padding: "8px" }}>{r.bedTime}</td>
                    <td style={{ padding: "8px" }}>{r.mood}</td>
                    <td style={{ padding: "8px", fontSize: "0.85rem" }}>{r.memo}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    );
}