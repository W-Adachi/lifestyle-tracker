"use client";

import styles from "./RecordForm.module.css";
import { useRecordForm } from "./useRecordForm";

export default function RecordForm() {
  // ① カスタムフックからロジック（状態と処理）を受け取る
    const { formData, handleChange, handleSubmit } = useRecordForm();

  // ② 見た目（HTML構造）だけを記述する
    return (
        <form onSubmit={handleSubmit} className={styles.formCard}>
        <h2 className={styles.title}>今日の生活記録</h2>

        {/* 日付入力 */}
        <div className={styles.fieldGroup}>
            <label className={styles.label}>日付</label>
            <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange("date", e.target.value)}
            className={styles.input}
            required
            />
        </div>

        {/* 睡眠時間（起床・就寝） */}
        <div className={styles.timeGrid}>
            <div>
            <label className={styles.label}>起床時間</label>
            <input
                type="time"
                value={formData.wakeUpTime}
                onChange={(e) => handleChange("wakeUpTime", e.target.value)}
                className={styles.input}
                required
            />
            </div>
            <div>
            <label className={styles.label}>就寝時間</label>
            <input
                type="time"
                value={formData.sleepTime}
                onChange={(e) => handleChange("sleepTime", e.target.value)}
                className={styles.input}
                required
            />
            </div>
        </div>

        {/* 気分・体調 (1〜5) */}
        <div className={styles.fieldGroup}>
            <label className={styles.label}>気分・体調 (1: 悪い 〜 5: 良い)</label>
            <select
            value={formData.condition}
            onChange={(e) => handleChange("condition", Number(e.target.value))}
            className={styles.select}
            >
            <option value={1}>1 - かなり辛い</option>
            <option value={2}>2 - やや辛い</option>
            <option value={3}>3 - 普通</option>
            <option value={4}>4 - 良い</option>
            <option value={5}>5 - とても良い</option>
            </select>
        </div>

        {/* メモ入力 */}
        <div className={styles.fieldGroup}>
            <label className={styles.label}>メモ</label>
            <textarea
            value={formData.memo}
            onChange={(e) => handleChange("memo", e.target.value)}
            placeholder="散歩に行けた、頭痛があった等"
            className={styles.textarea}
            />
        </div>

        {/* 送信ボタン */}
        <button type="submit" className={styles.submitButton}>
            記録を保存する
        </button>
        </form>
    );
}