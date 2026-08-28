"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
    const printRef = useRef<HTMLDivElement>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
        const res = await fetch("/api/lifestyle-records", {
            cache: "no-store",
        });
        if (!res.ok) {
            throw new Error("データの取得に失敗しました");
        }
        const data: RecordItem[] = await res.json();
        // 日付の古い順に並び替えてグラフ描画用に整形
        const sortedData = [...data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setRecords(sortedData);
        } catch (err: any) {
        setError(err.message || "エラーが発生しました");
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    // 時間文字列（"08:00:00" など）をグラフ用の数値（8.0など）に変換する関数
    const parseTimeToHour = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours + minutes / 60;
    };

    // グラフ用データ
    const chartData = records.map((rec) => ({
        date: rec.date,
        起床時間: parseTimeToHour(rec.wake_time),
        就寝時間: parseTimeToHour(rec.bed_time),
    }));

    // PDF保存処理 (型エラー・ダークモード対策版)
    const handleDownloadPDF = async () => {
        if (!printRef.current) return;
        const html2pdf = (await import("html2pdf.js")).default;
        const element = printRef.current;

        // 一時的に白背景・黒文字クラスを付与
        element.classList.add("print-mode");

        const opt = {
        margin: 10,
        filename: "lifestyle_records.pdf",
        image: { type: "jpeg" as const, quality: 0.98 }, // ← as const で型エラー解消
        html2canvas: { 
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        };

        try {
        await html2pdf().set(opt).from(element).save();
        } finally {
        // PDF化が終わったら元のスタイルに戻す
        element.classList.remove("print-mode");
        }
    };
    
    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
            <Link href="/">← 入力画面へ戻る</Link>
            <button onClick={fetchRecords}>手動更新</button>
            <button onClick={handleDownloadPDF} style={{ fontWeight: "bold" }}>
            PDFダウンロード
            </button>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* PDF印刷対象領域 */}
        <div ref={printRef} style={{ padding: "10px", backgroundColor: "#fff" }}>
            <h1 style={{ fontSize: "20px", marginBottom: "15px" }}>生活記録一覧</h1>

            {/* グラフ表示 */}
            {records.length > 0 && (
            <div style={{ width: "100%", height: 300, marginBottom: "30px" }}>
                <h3>睡眠時間グラフ</h3>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 24]} ticks={[0, 6, 12, 18, 24]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="起床時間" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="就寝時間" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
                </ResponsiveContainer>
            </div>
            )}

            {/* 記録リスト */}
            {!loading && records.length === 0 ? (
            <p>記録がまだありません。</p>
            ) : (
            <ul className="list-none p-0">
                {records.map((rec) => (
                <li
                    key={rec.id}
                    className="border border-gray-300 rounded-lg p-3 mb-2 text-sm"
                >
                    <strong>日付: {rec.date}</strong>
                    <div>就寝: {rec.bed_time} / 起床: {rec.wake_time}</div>
                    <div>睡眠の質: {rec.sleep_quality}</div>
                </li>
                ))}
            </ul>
            )}
        </div>
        </div>
    );
}