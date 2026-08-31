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
  outgoing_start?: string | null;
  outgoing_end?: string | null;
  study_start?: string | null;
  study_end?: string | null;
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

  // 絞り込み用State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [filterMood, setFilterMood] = useState<string>("all");
  const [filterHealth, setFilterHealth] = useState<string>("all");
  const [filterMedication, setFilterMedication] = useState<string>("all");

  // 編集モーダル用のチェックBOX用ローカルState
  const [editHasOutgoing, setEditHasOutgoing] = useState(false);
  const [editHasStudy, setEditHasStudy] = useState(false);

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

  // 絞り込みロジック
  const filteredRecords = records.filter((rec) => {
    // 日付の範囲判定
    if (startDate && rec.date < startDate) return false;
    if (endDate && rec.date > endDate) return false;
    // 気分
    if (filterMood !== "all" && rec.mood !== filterMood) return false;
    // 体調
    if (filterHealth !== "all" && rec.health !== filterHealth) return false;
    // 服薬
    if (filterMedication === "done" && !rec.medication) return false;
    if (filterMedication === "yet" && rec.medication) return false;

    return true;
  });

  // 並び替え
  const sortedRecords = [...filteredRecords].sort((a, b) => {
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

  const handleOpenEdit = (rec: RecordItem) => {
    setEditingRecord({ ...rec });
    setEditHasOutgoing(!!(rec.outgoing_start && rec.outgoing_end));
    setEditHasStudy(!!(rec.study_start && rec.study_end));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const updatePayload = {
      ...editingRecord,
      outgoing_start: editHasOutgoing ? (editingRecord.outgoing_start || "10:00") : null,
      outgoing_end: editHasOutgoing ? (editingRecord.outgoing_end || "12:00") : null,
      study_start: editHasStudy ? (editingRecord.study_start || "14:00") : null,
      study_end: editHasStudy ? (editingRecord.study_end || "16:00") : null,
    };

    try {
      const res = await fetch("/api/lifestyle-records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) throw new Error("更新に失敗しました");

      setRecords((prev) =>
        prev.map((item) => (item.id === updatePayload.id ? updatePayload : item))
      );
      setEditingRecord(null);
      alert("データを更新しました");
    } catch (err: any) {
      alert(err.message || "更新時にエラーが発生しました");
    }
  };

  const extractHour = (timeStr: string | undefined | null): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length < 1) return null;
    const hour = parseInt(parts[0], 10);
    return isNaN(hour) ? null : hour;
  };

  const isTimeInRange = (startStr?: string | null, endStr?: string | null, hour?: number) => {
    if (hour === undefined) return false;
    const start = extractHour(startStr);
    const end = extractHour(endStr);
    if (start === null || end === null) return false;

    if (start > end) {
      return hour >= start || hour < end;
    } else if (start < end) {
      return hour >= start && hour < end;
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

  // 重複に対応したスタイル判定関数
  const getHourCellStyle = (rec: RecordItem, h: number) => {
    const isSleep = isTimeInRange(rec.bed_time, rec.wake_time, h);
    const isOutgoing = isTimeInRange(rec.outgoing_start, rec.outgoing_end, h);
    const isStudy = isTimeInRange(rec.study_start, rec.study_end, h);

    if (isOutgoing && isStudy) return styles.cellOverlap; // 外出 ✕ 学習の重複（紫）
    if (isSleep) return styles.cellSleep;               // 睡眠（青）
    if (isOutgoing) return styles.cellOutgoing;         // 外出（黄）
    if (isStudy) return styles.cellStudy;               // 学習（緑）
    return styles.cellEmpty;
  };

  const resetFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterMood("all");
    setFilterHealth("all");
    setFilterMedication("all");
  };

  return (
    <div className={styles.container}>
      {/* 画面上部操作エリア */}
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
          再読み込み
        </button>
        <button onClick={handleDownloadPDF} className={styles.btnPrimary}>
          PDFダウンロード
        </button>
      </div>

      {/* 絞り込みパネル */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label>期間:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={styles.inputDate}
          />
          <span>〜</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.inputDate}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>気分:</label>
          <select
            value={filterMood}
            onChange={(e) => setFilterMood(e.target.value)}
            className={styles.select}
          >
            <option value="all">すべて</option>
            <option value="良">良</option>
            <option value="中">中</option>
            <option value="悪">悪</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>体調:</label>
          <select
            value={filterHealth}
            onChange={(e) => setFilterHealth(e.target.value)}
            className={styles.select}
          >
            <option value="all">すべて</option>
            <option value="良">良</option>
            <option value="中">中</option>
            <option value="悪">悪</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>服薬:</label>
          <select
            value={filterMedication}
            onChange={(e) => setFilterMedication(e.target.value)}
            className={styles.select}
          >
            <option value="all">すべて</option>
            <option value="done">済</option>
            <option value="yet">未</option>
          </select>
        </div>

        <button onClick={resetFilters} className={styles.btnReset}>
          絞り込み解除
        </button>
      </div>

      {/* 色の凡例表示（画面用） */}
      <div className={styles.legendContainer}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.cellSleep}`} /> 睡眠
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.cellOutgoing}`} /> 外出
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.cellStudy}`} /> 学習
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.cellOverlap}`} /> 外出 & 学習（重複）
        </span>
      </div>

      {loading && <p>読み込み中...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 画面用：カード一覧 */}
      {!loading && sortedRecords.length === 0 ? (
        <p>該当する記録がありません。</p>
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
                  <div className={styles.cardSectionTitle}>生活パターン (5:00 - 翌4:00)</div>
                  <div className={styles.cardTimeBar}>
                    {HOURS.map((h) => (
                      <div
                        key={h}
                        className={`${styles.timeSegment} ${getHourCellStyle(rec, h)}`}
                        title={`${h}時`}
                      />
                    ))}
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
                  <div className={styles.cardSectionTitle}>日中の行動</div>
                  <div className={styles.tagGroup}>
                    {rec.outgoing_start && rec.outgoing_end ? (
                      <span className={styles.tag}>🚶 外出: {rec.outgoing_start}〜{rec.outgoing_end}</span>
                    ) : (
                      <span className={styles.tag}>🚶 外出: なし</span>
                    )}
                    {rec.study_start && rec.study_end ? (
                      <span className={styles.tag}>📖 学習: {rec.study_start}〜{rec.study_end}</span>
                    ) : (
                      <span className={styles.tag}>📖 学習: なし</span>
                    )}
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
                  <button onClick={() => handleOpenEdit(rec)} className={styles.btnEdit}>
                    編集
                  </button>
                  <button onClick={() => handleDelete(rec.id)} className={styles.btnDelete}>
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
                    value={editingRecord.bed_time || ""}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, bed_time: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>起床時間</label>
                  <input
                    type="time"
                    value={editingRecord.wake_time || ""}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, wake_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className={styles.modalActionSection}>
                <label><strong>日中の行動</strong></label>

                <div style={{ marginTop: "8px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={editHasOutgoing}
                      onChange={(e) => setEditHasOutgoing(e.target.checked)}
                    />
                    🚶 外出あり
                  </label>
                  {editHasOutgoing && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="time"
                        value={editingRecord.outgoing_start || "10:00"}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, outgoing_start: e.target.value })
                        }
                      />
                      <span>〜</span>
                      <input
                        type="time"
                        value={editingRecord.outgoing_end || "12:00"}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, outgoing_end: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "8px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={editHasStudy}
                      onChange={(e) => setEditHasStudy(e.target.checked)}
                    />
                    📖 学習あり
                  </label>
                  {editHasStudy && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="time"
                        value={editingRecord.study_start || "14:00"}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, study_start: e.target.value })
                        }
                      />
                      <span>〜</span>
                      <input
                        type="time"
                        value={editingRecord.study_end || "16:00"}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, study_end: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalGrid} style={{ marginTop: "12px" }}>
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

              <div style={{ marginTop: "12px" }}>
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

      {/* PDFダウンロード用コンテナ */}
      <div className={styles.pdfContainer}>
        <div ref={printRef} className={styles.sheet}>
          <div className={styles.sheetHeader}>
            <h1 className={styles.title}>生活リズム記録表</h1>
            
            {/* PDF用 色の凡例 */}
            <div className={styles.pdfLegend}>
              <span className={styles.pdfLegendItem}>
                <span className={`${styles.pdfLegendBox} ${styles.cellSleep}`} /> 睡眠
              </span>
              <span className={styles.pdfLegendItem}>
                <span className={`${styles.pdfLegendBox} ${styles.cellOutgoing}`} /> 外出
              </span>
              <span className={styles.pdfLegendItem}>
                <span className={`${styles.pdfLegendBox} ${styles.cellStudy}`} /> 学習
              </span>
              <span className={styles.pdfLegendItem}>
                <span className={`${styles.pdfLegendBox} ${styles.cellOverlap}`} /> 重複
              </span>
            </div>

            <div className={styles.count}>件数: {sortedRecords.length} 件</div>
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
                {sortedRecords.map((rec) => {
                  const bed = extractHour(rec.bed_time);
                  const wake = extractHour(rec.wake_time);
                  let sleepHours = 0;
                  if (bed !== null && wake !== null) {
                    sleepHours = bed > wake ? 24 - bed + wake : wake - bed;
                  }

                  return (
                    <tr key={rec.id} className={styles.tr}>
                      <td className={styles.td} style={{ fontWeight: "bold" }}>{rec.date}</td>
                      {HOURS.map((h) => (
                        <td
                          key={h}
                          className={`${styles.cellBase} ${getHourCellStyle(rec, h)}`}
                        />
                      ))}
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
                      <td className={styles.checkCell}>{rec.mood === "中" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.mood === "悪" ? "☑" : "☐"}</td>

                      <td className={styles.checkCell}>{rec.health === "良" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.health === "中" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.health === "悪" ? "☑" : "☐"}</td>

                      <td className={styles.checkCell}>{rec.appetite !== "悪" ? "☑" : "☐"}</td>
                      <td className={styles.checkCell}>{rec.appetite === "悪" ? "☑" : "☐"}</td>

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