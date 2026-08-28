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
    id: number;       // 表示上の連番
    rowIndex: number; // スプレッドシート上の行番号（2, 3, 4...）
    date: string;
    wakeTime: string;
    bedTime: string;
    mood: string;
    memo: string;
    };

    export default function RecordsPage() {
    const [records, setRecords] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc: 最新順, asc: 古い順

    const fetchRecords = () => {
        setLoading(true);
        fetch("/api/records")
        .then((res) => res.json())
        .then((data) => {
            const rawRows = data.records || [];
            // スプレッドシートの実際の行番号（2行目スタート）を紐付ける
            const formatted = rawRows.map((r: any, index: number) => ({
            ...r,
            rowIndex: index + 2, // A2から始まっているため +2
            }));
            setRecords(formatted);
            setLoading(false);
        })
        .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // 睡眠時間の計算関数
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

    // 削除処理
    const handleDelete = async (rowIndex: number, date: string) => {
        if (!confirm(`${date} の記録を削除してもよろしいですか？`)) return;

        try {
        const res = await fetch(`/api/records?rowIndex=${rowIndex}`, {
            method: "DELETE",
        });
        if (res.ok) {
            alert("削除しました");
            fetchRecords(); // 一覧を再取得
        } else {
            alert("削除に失敗しました");
        }
        } catch (error) {
        console.error(error);
        alert("エラーが発生しました");
        }
    };

    // 並べ替え適用後のレコードリスト
    const sortedRecords = [...records].sort((a, b) => {
        if (sortOrder === "desc") {
        return b.date.localeCompare(a.date); // 最新順（降順）
        } else {
        return a.date.localeCompare(b.date); // ⭕ a と b を比較して昇順（古い順）にする
        }
    });
    
    // グラフ用データ（時系列順＝古い順に固定）
    const chartData = [...records]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
        date: r.date.slice(5),
        sleepHours: calculateSleepHours(r.bedTime, r.wakeTime),
        mood: Number(r.mood) || null,
        }));

    if (loading) return <p style={{ padding: "20px" }}>読み込み中...</p>;

    return (
        <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        {/* 印刷非表示ナビゲーション */}
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
            onClick={() => window.print()}
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

        {/* 記録一覧ヘッダー（整列コントロール） */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>記録一覧</h3>
            <div className="no-print">
            <label style={{ fontSize: "0.9rem", fontWeight: "bold", marginRight: "8px" }}>並べ替え:</label>
            <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
                <option value="desc">日付が新しい順</option>
                <option value="asc">日付が古い順</option>
            </select>
            </div>
        </div>

        {/* テーブル */}
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
            <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #ccc" }}>
                <th style={{ padding: "8px" }}>日付</th>
                <th style={{ padding: "8px" }}>起床時間</th>
                <th style={{ padding: "8px" }}>就寝時間</th>
                <th style={{ padding: "8px" }}>気分</th>
                <th style={{ padding: "8px" }}>メモ</th>
                <th className="no-print" style={{ padding: "8px", textAlign: "center" }}>操作</th>
            </tr>
            </thead>
            <tbody>
            {sortedRecords.map((r) => (
                <tr key={r.rowIndex} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px" }}>{r.date}</td>
                <td style={{ padding: "8px" }}>{r.wakeTime}</td>
                <td style={{ padding: "8px" }}>{r.bedTime}</td>
                <td style={{ padding: "8px" }}>{r.mood}</td>
                <td style={{ padding: "8px", fontSize: "0.85rem" }}>{r.memo}</td>
                <td className="no-print" style={{ padding: "8px", textAlign: "center" }}>
                    <button
                    onClick={() => handleDelete(r.rowIndex, r.date)}
                    style={{
                        padding: "4px 8px",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                    }}
                    >
                    削除
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}