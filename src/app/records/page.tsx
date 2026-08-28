"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./records.module.css";

interface RecordItem {
    id: number;
    date: string;
    wake_time: string;
    bed_time: string;
    // 睡眠の詳細
    sleep_onset?: string;        // 寝つきの良さ ("良" / "悪")
    mid_awakening?: boolean;    // 途中覚醒 (true / false)
    morning_refresh?: string;   // 起床時熟眠感 ("良" / "悪")
    daytime_sleepiness?: boolean;// 日中の眠気 (true / false)
    // 状態評価
    fatigue?: string;            // 疲労度 ("小" / "中" / "高")
    mood?: string;               // 気分 ("良" / "中" / "悪")
    health?: string;             // 体調 ("良" / "中" / "悪")
    appetite?: string;           // 食事/食欲 ("良" / "悪")
    medication?: boolean;        // 服薬 ("済" / "未")
    sleep_quality?: string;      // 既存フォールバック用
    memo?: string;
    created_at: string;
}

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];

export default function RecordsPage() {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const printRef = useRef<HTMLDivElement>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
        const res = await fetch("/api/lifestyle-records", { cache: "no-store" });
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data: RecordItem[] = await res.json();
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

    const extractHour = (timeStr: string | undefined): number | null => {
        if (!timeStr) return null;
        const parts = timeStr.split(":");
        if (parts.length < 1) return null;
        const hour = parseInt(parts[0], 10);
        return isNaN(hour) ? null : hour;
    };

    const isSleepingHour = (bedTimeStr: string, wakeTimeStr: string, hour: number) => {
        const bed = extractHour(bedTimeStr);
        const wake = extractHour(wakeTimeStr);
        if (bed === null || wake === null) return false;

        if (bed > wake) {
        return hour >= bed || hour < wake;
        } else if (bed < wake) {
        return hour >= bed && hour < wake;
        }
        return false;
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;
        const html2pdf = (await import("html2pdf.js")).default;
        const element = printRef.current;

        const opt = {
        margin: 5,
        filename: "lifestyle_sheet.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
        };

        try {
        await html2pdf().set(opt).from(element).save();
        } catch (err) {
        console.error(err);
        }
    };

    return (
        <div className={styles.container}>
        {/* 操作ボタン */}
        <div className={styles.actionBar}>
            <Link href="/" className={styles.backLink}>
            ← 入力画面へ戻る
            </Link>
            <button onClick={fetchRecords} className={styles.btnBtn}>
            手動更新
            </button>
            <button onClick={handleDownloadPDF} className={styles.btnPrimary}>
            PDFダウンロード
            </button>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* 記録表本体 */}
        <div ref={printRef} className={styles.sheet}>
            <div className={styles.sheetHeader}>
            <h1 className={styles.title}>生活リズム記録表</h1>
            <div className={styles.count}>件数: {records.length} 件</div>
            </div>

            {/* テーブル構造 */}
            <div className={styles.tableWrapper}>
            <table className={styles.table}>
                <thead>
                <tr className={styles.thHeaderGroup}>
                    {/* rowSpanを除外し、下部のボーダーを消す */}
                    <th className={styles.th} style={{ width: "70px", borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}>日付</th>
                    <th className={styles.th} colSpan={24}>1日の生活パターン (5:00 〜 翌4:00)</th>
                    <th className={styles.th} style={{ width: "45px", borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}>睡眠<br />時間</th>
                    <th className={styles.th} colSpan={4}>夕べの睡眠について</th>
                    <th className={styles.th} colSpan={3}>疲労度</th>
                    <th className={styles.th} colSpan={3}>気分</th>
                    <th className={styles.th} colSpan={3}>体調</th>
                    <th className={styles.th} colSpan={2}>食事</th>
                    <th className={styles.th} colSpan={2}>服薬</th>
                    <th className={styles.th} style={{ width: "90px", borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}>メモ</th>
                </tr>
                <tr className={styles.thHeaderSub}>
                    {/* 日付の下半分（空セル・上罫線なし・背景色合わせ） */}
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>

                    {HOURS.map((h) => (
                    <th key={h} className={styles.thHour}>{h}</th>
                    ))}

                    {/* 睡眠時間の下半分（空セル・上罫線なし・背景色合わせ） */}
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>

                    {/* 睡眠詳細 */}
                    <th className={styles.th}>寝つき</th>
                    <th className={styles.th}>中途覚醒</th>
                    <th className={styles.th}>熟眠感</th>
                    <th className={styles.th}>日中眠気</th>
                    {/* 疲労度 */}
                    <th className={styles.th}>小</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>高</th>
                    {/* 気分 */}
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>悪</th>
                    {/* 体調 */}
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>悪</th>
                    {/* 食事 */}
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>悪</th>
                    {/* 服薬 */}
                    <th className={styles.th}>済</th>
                    <th className={styles.th}>未</th>

                    {/* メモの下半分（空セル・上罫線なし・背景色合わせ） */}
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>
                </tr>
                </thead>
                <tbody>
                {records.length === 0 ? (
                    <tr>
                    <td colSpan={44} className={styles.td} style={{ padding: "20px" }}>
                        記録がありません。
                    </td>
                    </tr>
                ) : (
                    records.map((rec) => {
                    const bed = extractHour(rec.bed_time);
                    const wake = extractHour(rec.wake_time);

                    let sleepHours = 0;
                    if (bed !== null && wake !== null) {
                        sleepHours = bed > wake ? 24 - bed + wake : wake - bed;
                    }

                    return (
                        <tr key={rec.id} className={styles.tr}>
                        {/* 日付 */}
                        <td className={styles.td} style={{ fontWeight: "bold" }}>
                            {rec.date}
                        </td>

                        {/* 24時間マス目（黒の塗りつぶし） */}
                        {HOURS.map((h) => {
                            const active = isSleepingHour(rec.bed_time, rec.wake_time, h);
                            return (
                            <td
                                key={h}
                                className={`${styles.cellBase} ${
                                active ? styles.cellActive : styles.cellEmpty
                                }`}
                            />
                            );
                        })}

                        {/* 睡眠時間 */}
                        <td className={styles.td} style={{ fontWeight: "bold" }}>
                            {sleepHours > 0 ? `${sleepHours}h` : "-"}
                        </td>

                        {/* 夕べの睡眠について (〇/× または 良/悪) */}
                        <td className={styles.checkCell}>{rec.sleep_onset === "悪" ? "×" : "〇"}</td>
                        <td className={styles.checkCell}>{rec.mid_awakening ? "〇" : "×"}</td>
                        <td className={styles.checkCell}>{rec.morning_refresh === "悪" ? "×" : "〇"}</td>
                        <td className={styles.checkCell}>{rec.daytime_sleepiness ? "〇" : "×"}</td>

                        {/* 疲労度 (小/中/高) */}
                        <td className={styles.checkCell}>{rec.fatigue === "小" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.fatigue === "中" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.fatigue === "高" ? "☑" : "☐"}</td>

                        {/* 気分 (良/中/悪) */}
                        <td className={styles.checkCell}>{rec.mood === "良" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.mood === "中" || rec.sleep_quality === "normal" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.mood === "悪" || rec.sleep_quality === "bad" ? "☑" : "☐"}</td>

                        {/* 体調 (良/中/悪) */}
                        <td className={styles.checkCell}>{rec.health === "良" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.health === "中" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.health === "悪" ? "☑" : "☐"}</td>

                        {/* 食事 (良/悪) */}
                        <td className={styles.checkCell}>{rec.appetite === "悪" ? "☐" : "☑"}</td>
                        <td className={styles.checkCell}>{rec.appetite === "悪" ? "☑" : "☐"}</td>

                        {/* 服薬 (済/未) */}
                        <td className={styles.checkCell}>{rec.medication === false ? "☐" : "☑"}</td>
                        <td className={styles.checkCell}>{rec.medication === false ? "☑" : "☐"}</td>

                        {/* メモ */}
                        <td className={`${styles.td} ${styles.textSmall} ${styles.textLeft}`}>
                            {rec.memo || "-"}
                        </td>
                        </tr>
                    );
                    })
                )}
                </tbody>
            </table>
            </div>
        </div>
        </div>
    );
}