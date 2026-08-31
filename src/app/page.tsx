"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");

  // 夕べの睡眠
  const [sleepOnset, setSleepOnset] = useState<"良" | "悪">("良");
  const [midAwakening, setMidAwakening] = useState<boolean>(false);
  const [morningRefresh, setMorningRefresh] = useState<"良" | "悪">("良");
  const [daytimeSleepiness, setDaytimeSleepiness] = useState<boolean>(false);

  // コンディション評価
  const [fatigue, setFatigue] = useState<"小" | "中" | "高">("小");
  const [mood, setMood] = useState<"良" | "中" | "悪">("良");
  const [health, setHealth] = useState<"良" | "中" | "悪">("良");
  const [appetite, setAppetite] = useState<"良" | "悪">("良");
  const [medication, setMedication] = useState<boolean>(true);

  // 外出の有無と時間
  const [hasOutgoing, setHasOutgoing] = useState(false);
  const [outgoingStart, setOutgoingStart] = useState("10:00");
  const [outgoingEnd, setOutgoingEnd] = useState("12:00");

  // 学習の有無と時間
  const [hasStudy, setHasStudy] = useState(false);
  const [studyStart, setStudyStart] = useState("14:00");
  const [studyEnd, setStudyEnd] = useState("16:00");

  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      date,
      bed_time: bedTime,
      wake_time: wakeTime,
      sleep_onset: sleepOnset,
      mid_awakening: midAwakening,
      morning_refresh: morningRefresh,
      daytime_sleepiness: daytimeSleepiness,
      fatigue,
      mood,
      health,
      appetite,
      medication,
      outgoing_start: hasOutgoing ? outgoingStart : null,
      outgoing_end: hasOutgoing ? outgoingEnd : null,
      study_start: hasStudy ? studyStart : null,
      study_end: hasStudy ? studyEnd : null,
      memo,
    };

    try {
      const res = await fetch("/api/lifestyle-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("登録に失敗しました");

      setMessage("登録が完了しました！");
      setMemo("");
    } catch (err: any) {
      setMessage(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>生活リズム記録 入力</h1>
        <Link href="/records" className={styles.linkBtn}>
          📋 履歴・PDF出力画面へ
        </Link>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label>日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.formGroup}>
            <label>就寝時間</label>
            <input
              type="time"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              required
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label>起床時間</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              required
              className={styles.input}
            />
          </div>
        </div>

        {/* 夕べの睡眠評価 */}
        <fieldset className={styles.fieldset}>
          <legend>夕べの睡眠について</legend>
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label>寝つき</label>
              <select
                value={sleepOnset}
                onChange={(e) => setSleepOnset(e.target.value as "良" | "悪")}
                className={styles.select}
              >
                <option value="良">良 (〇)</option>
                <option value="悪">悪 (×)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>中途覚醒（途中で目が覚めたか）</label>
              <select
                value={midAwakening ? "true" : "false"}
                onChange={(e) => setMidAwakening(e.target.value === "true")}
                className={styles.select}
              >
                <option value="false">なし (×)</option>
                <option value="true">あり (〇)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>熟眠感（すっきり起きられたか）</label>
              <select
                value={morningRefresh}
                onChange={(e) => setMorningRefresh(e.target.value as "良" | "悪")}
                className={styles.select}
              >
                <option value="良">良 (〇)</option>
                <option value="悪">悪 (×)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>日中の眠気</label>
              <select
                value={daytimeSleepiness ? "true" : "false"}
                onChange={(e) => setDaytimeSleepiness(e.target.value === "true")}
                className={styles.select}
              >
                <option value="false">なし (×)</option>
                <option value="true">あり (〇)</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* コンディション評価 */}
        <fieldset className={styles.fieldset}>
          <legend>日中のコンディション</legend>
          <div className={styles.grid3}>
            <div className={styles.formGroup}>
              <label>疲労度</label>
              <select
                value={fatigue}
                onChange={(e) => setFatigue(e.target.value as "小" | "中" | "高")}
                className={styles.select}
              >
                <option value="小">小</option>
                <option value="中">中</option>
                <option value="高">高</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>気分</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as "良" | "中" | "悪")}
                className={styles.select}
              >
                <option value="良">良</option>
                <option value="中">中</option>
                <option value="悪">悪</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>体調</label>
              <select
                value={health}
                onChange={(e) => setHealth(e.target.value as "良" | "中" | "悪")}
                className={styles.select}
              >
                <option value="良">良</option>
                <option value="中">中</option>
                <option value="悪">悪</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>食事</label>
              <select
                value={appetite}
                onChange={(e) => setAppetite(e.target.value as "良" | "悪")}
                className={styles.select}
              >
                <option value="良">良</option>
                <option value="悪">悪</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>服薬</label>
              <select
                value={medication ? "true" : "false"}
                onChange={(e) => setMedication(e.target.value === "true")}
                className={styles.select}
              >
                <option value="true">済</option>
                <option value="false">未</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* 日中の行動（外出・学習） */}
        <fieldset className={styles.fieldset}>
          <legend>日中の行動</legend>

          {/* 外出 */}
          <div className={styles.actionGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={hasOutgoing}
                onChange={(e) => setHasOutgoing(e.target.checked)}
              />
              🚶‍♂️ 外出あり
            </label>

            {hasOutgoing && (
              <div className={styles.timeInputRow}>
                <input
                  type="time"
                  value={outgoingStart}
                  onChange={(e) => setOutgoingStart(e.target.value)}
                  className={styles.input}
                />
                <span>〜</span>
                <input
                  type="time"
                  value={outgoingEnd}
                  onChange={(e) => setOutgoingEnd(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}
          </div>

          {/* 学習 */}
          <div className={styles.actionGroup} style={{ marginTop: "16px" }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={hasStudy}
                onChange={(e) => setHasStudy(e.target.checked)}
              />
              📖 学習あり
            </label>

            {hasStudy && (
              <div className={styles.timeInputRow}>
                <input
                  type="time"
                  value={studyStart}
                  onChange={(e) => setStudyStart(e.target.value)}
                  className={styles.input}
                />
                <span>〜</span>
                <input
                  type="time"
                  value={studyEnd}
                  onChange={(e) => setStudyEnd(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}
          </div>
        </fieldset>

        <div className={styles.formGroup}>
          <label>メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className={styles.textarea}
            placeholder="特記事項があれば入力"
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "送信中..." : "記録を保存する"}
        </button>

        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
}