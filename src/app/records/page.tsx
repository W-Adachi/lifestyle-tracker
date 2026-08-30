"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "./records.module.css";

interface RecordItem {
  id: number;
  date: string;
  wake_time: string;
  bed_time: string;
  sleep_onset?: "良" | "悪";
  mid_awakening?: boolean;
  morning_refresh?: "良" | "悪";
  daytime_sleepiness?: boolean;
  fatigue?: "小" | "中" | "高";
  mood?: "良" | "中" | "悪";
  health?: "良" | "中" | "悪";
  appetite?: "良" | "悪";
  medication?: boolean;
  memo?: string;
  created_at?: string;
}

const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];

export default function RecordsPage() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      const res = await fetch("/api/lifestyle-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingRecord),
      });

      if (!res.ok) throw new Error("更新に失敗しました");

      setRecords((prev) =>
        prev.map((item) => (item.id === editingRecord.id ? editingRecord : item))
      );
      setEditingRecord(null);
      alert("データを更新しました");
    } catch (err: any) {
      alert(err.message || "更新時にエラーが発生しました");
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
      margin: [5, 5, 5, 5],
      filename: `lifestyle_sheet_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
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

                <div className={styles.cardSection}>
                  <div className={styles.cardSectionTitle}>夕べの睡眠</div>
                  <div className={styles.tagGroup}>
                    <span className={styles.tag}>寝つき: {rec.sleep_onset === "悪" ? "×" : "〇"}</span>
                    <span className={styles.tag}>中途覚醒: {rec.mid_awakening ? "〇" : "×"}</span>
                    <span className={styles.tag}>熟眠感: {rec.morning_refresh === "悪" ? "×" : "〇"}</span>
                    <span className={styles.tag}>眠気: {rec.daytime_sleepiness ? "〇" : "×"}</span>
                  </div>
                </div>

                <div className={styles.cardSection}>
                  <div className={styles.cardSectionTitle}>状態・評価</div>
                  <div className={styles.tagGroup}>
                    {rec.fatigue && <span className={styles.tag}>疲労: {rec.fatigue}</span>}
                    {rec.mood && <span className={styles.tag}>気分: {rec.mood}</span>}
                    {rec.health && <span className={styles.tag}>体調: {rec.health}</span>}
                    {rec.appetite && <span className={styles.tag}>食事: {rec.appetite}</span>}
                    {rec.medication !== undefined && (
                      <span className={styles.tag}>服薬: {rec.medication ? "済" : "未"}</span>
                    )}
                  </div>
                </div>

                {rec.memo && <div className={styles.cardMemo}>{rec.memo}</div>}

                <div className={styles.cardFooter}>
                  <button
                    onClick={() => setEditingRecord(rec)}
                    className={styles.btnEdit}
                  >
                    編集
                  </button>
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

      {/* 編集モーダル */}
      {editingRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>記録の編集 ({editingRecord.date})</h2>
            <form onSubmit={handleUpdate} className={styles.modalForm}>
              <div className={styles.modalRow}>
                <div>
                  <label>就寝時間</label>
                  <input
                    type="time"
                    value={editingRecord.bed_time}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, bed_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>起床時間</label>
                  <input
                    type="time"
                    value={editingRecord.wake_time}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, wake_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalGrid}>
                <div>
                  <label>寝つき</label>
                  <select
                    value={editingRecord.sleep_onset || "良"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, sleep_onset: e.target.value as "良" | "悪" })
                    }
                  >
                    <option value="良">良 (〇)</option>
                    <option value="悪">悪 (×)</option>
                  </select>
                </div>

                <div>
                  <label>中途覚醒</label>
                  <select
                    value={editingRecord.mid_awakening ? "true" : "false"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, mid_awakening: e.target.value === "true" })
                    }
                  >
                    <option value="false">なし (×)</option>
                    <option value="true">あり (〇)</option>
                  </select>
                </div>

                <div>
                  <label>熟眠感</label>
                  <select
                    value={editingRecord.morning_refresh || "良"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, morning_refresh: e.target.value as "良" | "悪" })
                    }
                  >
                    <option value="良">良 (〇)</option>
                    <option value="悪">悪 (×)</option>
                  </select>
                </div>

                <div>
                  <label>昼間の眠気</label>
                  <select
                    value={editingRecord.daytime_sleepiness ? "true" : "false"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, daytime_sleepiness: e.target.value === "true" })
                    }
                  >
                    <option value="false">なし (×)</option>
                    <option value="true">あり (〇)</option>
                  </select>
                </div>

                <div>
                  <label>疲労度</label>
                  <select
                    value={editingRecord.fatigue || "小"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, fatigue: e.target.value as "小" | "中" | "高" })
                    }
                  >
                    <option value="小">小</option>
                    <option value="中">中</option>
                    <option value="高">高</option>
                  </select>
                </div>

                <div>
                  <label>気分</label>
                  <select
                    value={editingRecord.mood || "良"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, mood: e.target.value as "良" | "中" | "悪" })
                    }
                  >
                    <option value="良">良</option>
                    <option value="中">中</option>
                    <option value="悪">悪</option>
                  </select>
                </div>

                <div>
                  <label>体調</label>
                  <select
                    value={editingRecord.health || "良"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, health: e.target.value as "良" | "中" | "悪" })
                    }
                  >
                    <option value="良">良</option>
                    <option value="中">中</option>
                    <option value="悪">悪</option>
                  </select>
                </div>

                <div>
                  <label>食事</label>
                  <select
                    value={editingRecord.appetite || "良"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, appetite: e.target.value as "良" | "悪" })
                    }
                  >
                    <option value="良">良</option>
                    <option value="悪">悪</option>
                  </select>
                </div>

                <div>
                  <label>服薬</label>
                  <select
                    value={editingRecord.medication !== false ? "true" : "false"}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, medication: e.target.value === "true" })
                    }
                  >
                    <option value="true">済</option>
                    <option value="false">未</option>
                  </select>
                </div>
              </div>

              <div>
                <label>メモ</label>
                <textarea
                  value={editingRecord.memo || ""}
                  onChange={(e) =>
                    setEditingRecord({ ...editingRecord, memo: e.target.value })
                  }
                />
              </div>

              <div className={styles.modalButtons}>
                <button type="button" onClick={() => setEditingRecord(null)}>
                  キャンセル
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  保存する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDFダウンロード専用要素（表形式の判定ロジック修正済み） */}
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
                  <th className={styles.th} style={{ borderBottom: "none", verticalAlign: "bottom" }}>日付</th>
                  <th className={styles.th} colSpan={24}>1日の生活パターン (5:00 〜 翌4:00)</th>
                  <th className={styles.th} style={{ borderBottom: "none", verticalAlign: "bottom" }}>睡眠<br />時間</th>
                  <th className={styles.th} colSpan={4}>夕べの睡眠について</th>
                  <th className={styles.th} colSpan={3}>疲労度</th>
                  <th className={styles.th} colSpan={3}>気分</th>
                  <th className={styles.th} colSpan={3}>体調</th>
                  <th className={styles.th} colSpan={2}>食事</th>
                  <th className={styles.th} colSpan={2}>服薬</th>
                  <th className={styles.th} style={{ borderBottom: "none", verticalAlign: "bottom" }}>メモ</th>
                </tr>
                <tr className={styles.thHeaderSub}>
                  <th className={styles.th} style={{ borderTop: "none" }}></th>
                  {HOURS.map((h) => (
                    <th key={h} className={styles.thHour}>{h}</th>
                  ))}
                  <th className={styles.th} style={{ borderTop: "none" }}></th>
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
                  <th className={styles.th} style={{ borderTop: "none" }}></th>
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
                      <td className={styles.td} style={{ fontWeight: "bold" }}>{rec.date}</td>
                      {HOURS.map((h) => {
                        const active = isSleepingHour(rec.bed_time, rec.wake_time, h);
                        return (
                          <td
                            key={h}
                            className={`${styles.cellBase} ${active ? styles.cellActive : styles.cellEmpty}`}
                          />
                        );
                      })}
                      <td className={styles.td} style={{ fontWeight: "bold" }}>
                        {sleepHours > 0 ? `${sleepHours}h` : "-"}
                      </td>

                      {/* 正確な〇×判定 */}
                      <td className={styles.checkCell}>{rec.sleep_onset === "悪" ? "×" : "〇"}</td>
                      <td className={styles.checkCell}>{rec.mid_awakening ? "〇" : "×"}</td>
                      <td className={styles.checkCell}>{rec.morning_refresh === "悪" ? "×" : "〇"}</td>
                      <td className={styles.checkCell}>{rec.daytime_sleepiness ? "〇" : "×"}</td>

                      {/* 疲労度 */}
                      <td className={styles.checkCell}>{rec.fatigue === "小" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.fatigue === "中" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.fatigue === "高" ? "☑" : "☐"}</td>

                      {/* 気分 */}
                      <td className={styles.checkCell}>{rec.mood === "良" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.mood === "中" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.mood === "悪" ? "☑" : "☐"}</td>

                      {/* 体調 */}
                      <td className={styles.checkCell}>{rec.health === "良" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.health === "中" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.health === "悪" ? "☑" : "☐"}</td>

                      {/* 食事 */}
                      <td className={styles.checkCell}>{rec.appetite !== "悪" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.appetite === "悪" ? "☑" : "☐"}</td>

                      {/* 服薬 */}
                      <td className={styles.checkCell}>{rec.medication !== false ? "☑" : "☐"}</td>
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