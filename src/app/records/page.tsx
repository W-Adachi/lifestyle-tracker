"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./records.module.css";

export default function RecordsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
        const res = await fetch("/api/lifestyle-records");
        if (!res.ok) throw new Error("取得失敗");
        const result = await res.json();
        
        // ★ 返り値が配列ならそのままセット、オブジェクト（result.data）の中に配列がある場合はそれをセット
        if (Array.isArray(result)) {
            setRecords(result);
        } else if (result && Array.isArray(result.data)) {
            setRecords(result.data);
        } else {
            setRecords([]);
        }
        } catch (err) {
        console.error(err);
        setRecords([]);
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
        const res = await fetch(`/api/lifestyle-records?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchRecords();
        } catch (err) {
        alert("削除に失敗しました");
        }
    };

    if (loading) return <div className={styles.container}>読み込み中...</div>;

    return (
        <div className={styles.container}>
        <div className={styles.header}>
            <h1 className={styles.title}>生活リズムの記録一覧</h1>
            <Link href="/" className={styles.backLink}>
            ← フォームへ戻る
            </Link>
        </div>

        <div className={styles.tableWrapper}>
            <table className={styles.table}>
            <thead>
                <tr>
                <th className={styles.th}>日付</th>
                <th className={styles.th}>睡眠時間</th>
                <th className={styles.th}>睡眠評価</th>
                <th className={styles.th}>体調 / 気分</th>
                <th className={styles.th}>食事</th>
                <th className={styles.th}>メモ</th>
                <th className={styles.th}>操作</th>
                </tr>
            </thead>
            <tbody>
                {/* ★ Array.isArray で配列である場合のみ map を実行 */}
                {Array.isArray(records) && records.length > 0 ? (
                records.map((r) => (
                    <tr key={r.id} className={styles.tr}>
                    <td className={styles.td}>
                        <strong>{r.date}</strong>
                    </td>
                    <td className={styles.td}>
                        {r.bed_time} ～ {r.wake_time}
                    </td>
                    <td className={styles.td}>
                        <div className={styles.badgeGroup}>
                        <span
                            className={`${styles.badge} ${
                            r.sleep_quality === "good" ? styles.badgeSuccess : styles.badgeWarning
                            }`}
                        >
                            寝つき: {r.sleep_quality === "good" ? "良" : "悪"}
                        </span>
                        {r.morning_refreshed && (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>爽快感あり</span>
                        )}
                        {r.woke_up_night && (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>途中覚醒あり</span>
                        )}
                        </div>
                    </td>
                    <td className={styles.td}>
                        <div className="text-xs space-y-1">
                        <div>疲労: {r.fatigue_level}</div>
                        <div>気分: {r.mood}</div>
                        </div>
                    </td>
                    <td className={styles.td}>
                        <div className={styles.badgeGroup}>
                        {r.breakfast && <span className={styles.badge}>朝</span>}
                        {r.lunch && <span className={styles.badge}>昼</span>}
                        {r.dinner && <span className={styles.badge}>晩</span>}
                        </div>
                    </td>
                    <td className={styles.td}>{r.memo || "-"}</td>
                    <td className={styles.td}>
                        <button onClick={() => handleDelete(r.id)} className={styles.deleteBtn}>
                        削除
                        </button>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan={7} className={styles.td} style={{ textAlign: "center" }}>
                    記録がありません
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        </div>
    );
}