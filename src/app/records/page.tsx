"use client";

import { useEffect, useState, useMemo } from "react";
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
    rowIndex: number;
    date: string;
    wakeTime: string;
    bedTime: string;
    mood: string;
    memo: string;
    };

    export default function RecordsPage() {
    const [records, setRecords] = useState<RecordType[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [filterPeriod, setFilterPeriod] = useState<string>("1week"); // 初期表示を直近1週間に設定

    const fetchRecords = () => {
        setLoading(true);
        fetch("/api/records")
        .then((res) => res.json())
        .then((data) => {
            const rawRows = data.records || [];
            const formatted = rawRows.map((r: any, index: number) => ({
            ...r,
            rowIndex: index + 2,
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
            fetchRecords();
        } else {
            alert("削除に失敗しました");
        }
        } catch (error) {
        console.error(error);
        alert("エラーが発生しました");
        }
    };

    // 絞り込み ＆ ソート済みのデータを算出
    const filteredAndSortedRecords = useMemo(() => {
        const now = new Date();

        const filtered = records.filter((r) => {
        if (filterPeriod === "all") return true;

        const recordDate = new Date(r.date);
        const diffTime = now.getTime() - recordDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (filterPeriod === "1week") {
            return diffDays >= 0 && diffDays <= 7;
        }
        if (filterPeriod === "1month") {
            return diffDays >= 0 && diffDays <= 30;
        }
        return true;
        });

        return filtered.sort((a, b) => {
        if (sortOrder === "desc") {
            return b.date.localeCompare(a.date);
        } else {
            return a.date.localeCompare(b.date);
        }
        });
    }, [records, filterPeriod, sortOrder]);

    // グラフ用データ（絞り込んだデータの中で日付の昇順に固定）
    const chartData = useMemo(() => {
        return [...filteredAndSortedRecords]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((r) => ({
            date: r.date.slice(5),
            sleepHours: calculateSleepHours(r.bedTime, r.wakeTime),
            mood: Number(r.mood) || null,
        }));
    }, [filteredAndSortedRecords]);

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

        {/* 記録一覧ヘッダー（絞り込み・整列） */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0 }}>記録一覧</h3>
            <div className="no-print" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div>
                <label style={{ fontSize: "0.9rem", fontWeight: "bold", marginRight: "6px" }}>期間:</label>
                <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                >
                <option value="1week">直近1週間分</option>
                <option value="1month">直近1ヶ月分</option>
                <option value="all">すべて表示</option>
                </select>
            </div>

            <div>
                <label style={{ fontSize: "0.9rem", fontWeight: "bold", marginRight: "6px" }}>並べ替え:</label>
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
            {filteredAndSortedRecords.map((r) => (
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