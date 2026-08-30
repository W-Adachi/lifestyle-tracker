"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./records.module.css";

interface RecordItem {
    id: number;
    date: string;
    wake_time: string;
    bed_time: string;
    sleep_onset?: string;
    mid_awakening?: boolean;
    morning_refresh?: string;
    daytime_sleepiness?: boolean;
    fatigue?: string;
    mood?: string;
    health?: string;
    appetite?: string;
    medication?: boolean;
    sleep_quality?: string;
    memo?: string;
    created_at: string;
}

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];

export default function RecordsPage() {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc"); // デフォルトは新しい順（降順）
    const printRef = useRef<HTMLDivElement>(null);

    const fetchRecords = async () => {
        setLoading(true);
        try {
        const res = await fetch("/api/lifestyle-records", { cache: "no-store" });
        if (!res.ok) throw new Error("データの取得に失敗しました");
        const data: RecordItem[] = await res.json();
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

    const sortedRecords = [...records].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });

    const handleDelete = async (id: number) => {
        if (!window.confirm("このレコードを削除してもよろしいですか？")) return;

        try {
        const res = await fetch(`/api/lifestyle-records?id=${id}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error("削除に失敗しました");
        setRecords((prev) => prev.filter((item) => item.id !== id));
        } catch (err: any) {
        alert(err.message || "削除時にエラーが発生しました");
        }
    };

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

        const opt: any = {
            margin: [5, 5, 5, 5] as [number, number, number, number],
            filename: `lifestyle_sheet_${new Date().toISOString().split("T")[0]}.pdf`,
            image: { type: "jpeg" as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                windowWidth: 1100,
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
        };

        try {
        await html2pdf().set(opt).from(element).save();
        } catch (err) {
        console.error(err);
        }
    };

    return (
        <div className={styles.container}>
        {/* 操作バー */}
        <div className={styles.actionBar}>
            <Link href="/" className={styles.backLink}>
            ← 入力画面へ戻る
            </Link>

            <div className={styles.sortBox}>
            <label htmlFor="sort">並び順:</label>
            <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className={styles.select}
            >
                <option value="desc">新しい順</option>
                <option value="asc">古い順</option>
            </select>
            </div>

            <button onClick={fetchRecords} className={styles.btnBtn}>
            更新
            </button>
            <button onClick={handleDownloadPDF} className={styles.btnPrimary}>
            PDFダウンロード
            </button>
        </div>

        {loading && <p>読み込み中...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* 画面用：カード一覧表示 */}
        {!loading && sortedRecords.length === 0 ? (
            <p>記録がありません。</p>
        ) : (
            <div className={styles.cardGrid}>
            {sortedRecords.map((rec) => {
                const bed = extractHour(rec.bed_time);
                const wake = extractHour(rec.wake_time);
                let sleepHours = 0;
                if (bed !== null && wake !== null) {
                sleepHours = bed > wake ? 24 - bed + wake : wake - bed;
                }

                return (
                <div key={rec.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                    <div className={styles.cardDate}>{rec.date}</div>
                    <div className={styles.cardSleepHours}>
                        睡眠: {sleepHours > 0 ? `${sleepHours}時間` : "-"}
                    </div>
                    </div>

                    {/* 24時間の簡易睡眠バー */}
                    <div className={styles.cardSection}>
                    <div className={styles.cardSectionTitle}>睡眠パターン (5:00 - 翌4:00)</div>
                    <div className={styles.cardTimeBar}>
                        {HOURS.map((h) => {
                        const active = isSleepingHour(rec.bed_time, rec.wake_time, h);
                        return (
                            <div
                            key={h}
                            className={`${styles.timeSegment} ${
                                active ? styles.timeActive : styles.timeEmpty
                            }`}
                            title={`${h}時: ${active ? "睡眠" : "覚醒"}`}
                            />
                        );
                        })}
                    </div>
                    </div>

                    {/* ステータス・タグ表示 */}
                    <div className={styles.cardSection}>
                    <div className={styles.cardSectionTitle}>状態・評価</div>
                    <div className={styles.tagGroup}>
                        {rec.fatigue && <span className={styles.tag}>疲労: {rec.fatigue}</span>}
                        {rec.mood && <span className={styles.tag}>気分: {rec.mood}</span>}
                        {rec.health && <span className={styles.tag}>体調: {rec.health}</span>}
                        {rec.appetite && (
                        <span
                            className={`${styles.tag} ${
                            rec.appetite === "良" ? styles.tagGood : styles.tagBad
                            }`}
                        >
                            食事: {rec.appetite}
                        </span>
                        )}
                        {rec.medication !== undefined && (
                        <span
                            className={`${styles.tag} ${
                            rec.medication ? styles.tagGood : styles.tagBad
                            }`}
                        >
                            服薬: {rec.medication ? "済" : "未"}
                        </span>
                        )}
                    </div>
                    </div>

                    {/* メモ */}
                    {rec.memo && <div className={styles.cardMemo}>{rec.memo}</div>}

                    <div className={styles.cardFooter}>
                    <button
                        onClick={() => handleDelete(rec.id)}
                        className={styles.btnDelete}
                    >
                        削除
                    </button>
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* PDFダウンロード専用要素（画面外に配置） */}
        <div className={styles.pdfContainer}>
            <div ref={printRef} className={styles.sheet}>
            <div className={styles.sheetHeader}>
                <h1 className={styles.title}>生活リズム記録表</h1>
                <div className={styles.count}>件数: {records.length} 件</div>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                <colgroup>
                    <col style={{ width: "70px" }} />
                    {HOURS.map((h) => (
                    <col key={h} style={{ width: "16px" }} />
                    ))}
                    <col style={{ width: "35px" }} />
                    <col style={{ width: "22px" }} />
                    <col style={{ width: "22px" }} />
                    <col style={{ width: "22px" }} />
                    <col style={{ width: "22px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "18px" }} />
                    <col style={{ width: "auto" }} />
                </colgroup>
                <thead>
                    <tr className={styles.thHeaderGroup}>
                    <th
                        className={styles.th}
                        style={{ borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}
                    >
                        日付
                    </th>
                    <th className={styles.th} colSpan={24}>
                        1日の生活パターン (5:00 〜 翌4:00)
                    </th>
                    <th
                        className={styles.th}
                        style={{ borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}
                    >
                        睡眠<br />時間
                    </th>
                    <th className={styles.th} colSpan={4}>
                        夕べの睡眠について
                    </th>
                    <th className={styles.th} colSpan={3}>
                        疲労度
                    </th>
                    <th className={styles.th} colSpan={3}>
                        気分
                    </th>
                    <th className={styles.th} colSpan={3}>
                        体調
                    </th>
                    <th className={styles.th} colSpan={2}>
                        食事
                    </th>
                    <th className={styles.th} colSpan={2}>
                        服薬
                    </th>
                    <th
                        className={styles.th}
                        style={{ borderBottom: "none", verticalAlign: "bottom", paddingBottom: "2px" }}
                    >
                        メモ
                    </th>
                    </tr>
                    <tr className={styles.thHeaderSub}>
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>
                    {HOURS.map((h) => (
                        <th key={h} className={styles.thHour}>
                        {h}
                        </th>
                    ))}
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>
                    <th className={styles.th}>寝つ</th>
                    <th className={styles.th}>中途</th>
                    <th className={styles.th}>熟眠</th>
                    <th className={styles.th}>眠気</th>
                    <th className={styles.th}>小</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>高</th>
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>悪</th>
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>中</th>
                    <th className={styles.th}>悪</th>
                    <th className={styles.th}>良</th>
                    <th className={styles.th}>悪</th>
                    <th className={styles.th}>済</th>
                    <th className={styles.th}>未</th>
                    <th className={styles.th} style={{ borderTop: "none", backgroundColor: "#e5e7eb" }}></th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((rec) => {
                    const bed = extractHour(rec.bed_time);
                    const wake = extractHour(rec.wake_time);
                    let sleepHours = 0;
                    if (bed !== null && wake !== null) {
                        sleepHours = bed > wake ? 24 - bed + wake : wake - bed;
                    }

                    return (
                        <tr key={rec.id} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: "bold" }}>
                            {rec.date}
                        </td>
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
                        <td className={styles.td} style={{ fontWeight: "bold" }}>
                            {sleepHours > 0 ? `${sleepHours}h` : "-"}
                        </td>
                        <td className={styles.checkCell}>{rec.sleep_onset === "悪" ? "×" : "〇"}</td>
                        <td className={styles.checkCell}>{rec.mid_awakening ? "〇" : "×"}</td>
                        <td className={styles.checkCell}>{rec.morning_refresh === "悪" ? "×" : "〇"}</td>
                        <td className={styles.checkCell}>{rec.daytime_sleepiness ? "〇" : "×"}</td>
                        <td className={styles.checkCell}>{rec.fatigue === "小" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.fatigue === "中" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.fatigue === "高" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.mood === "良" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.mood === "中" || rec.sleep_quality === "normal" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.mood === "悪" || rec.sleep_quality === "bad" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.health === "良" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.health === "中" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.health === "悪" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.appetite === "悪" ? "☐" : "☑"}</td>
                        <td className={styles.checkCell}>{rec.appetite === "悪" ? "☑" : "☐"}</td>
                        <td className={styles.checkCell}>{rec.medication === false ? "☐" : "☑"}</td>
                        <td className={styles.checkCell}>{rec.medication === false ? "☑" : "☐"}</td>
                        <td className={`${styles.td} ${styles.textSmall} ${styles.textLeft}`}>
                            {rec.memo || "-"}
                        </td>
                        </tr>
                    );
                    })}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        </div>
    );
}