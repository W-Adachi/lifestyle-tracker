"use client";

import { useState, FormEvent } from "react";
import { TimePicker } from "@/components/ui/TimePicker";
import styles from "./RecordForm.module.css";

interface RecordFormData {
    date: string;
    wake_time: string;
    bed_time: string;
    sleep_quality: string;
    woke_up_night: boolean;
    morning_refreshed: boolean;
    daytime_sleepiness: boolean;
    fatigue_level: string;
    mood: string;
    condition: string;
    motivation: string;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    med_morning: boolean;
    med_noon: boolean;
    med_night: boolean;
    memo: string;
    }

    const INITIAL_FORM_DATA: RecordFormData = {
    date: new Date().toISOString().split("T")[0],
    wake_time: "07:00",
    bed_time: "23:00",
    sleep_quality: "good",
    woke_up_night: false,
    morning_refreshed: true,
    daytime_sleepiness: false,
    fatigue_level: "medium",
    mood: "medium",
    condition: "medium",
    motivation: "medium",
    breakfast: true,
    lunch: true,
    dinner: true,
    med_morning: false,
    med_noon: false,
    med_night: false,
    memo: "",
    };

    export default function RecordForm({ onRecordAdded }: { onRecordAdded?: () => void }) {
    const [formData, setFormData] = useState<RecordFormData>(INITIAL_FORM_DATA);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
        const res = await fetch("/api/lifestyle-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error("保存に失敗しました");

        alert("記録を保存しました");
        if (onRecordAdded) onRecordAdded();
        } catch (err) {
        console.error(err);
        alert("エラーが発生しました");
        } finally {
        setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.formCard}>
        <h2 className={styles.title}>生活リズムの記録</h2>

        {/* 基本日時 */}
        <div className={styles.gridThree}>
            <div>
            <label htmlFor="date" className="block text-xs font-semibold mb-1">
                日付
            </label>
            <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className={styles.input}
            />
            </div>
            <TimePicker
            id="bed_time"
            label="就寝時間"
            value={formData.bed_time}
            onChange={(val) => setFormData({ ...formData, bed_time: val })}
            />
            <TimePicker
            id="wake_time"
            label="起床時間"
            value={formData.wake_time}
            onChange={(val) => setFormData({ ...formData, wake_time: val })}
            />
        </div>

        {/* 睡眠の状態 */}
        <fieldset className={styles.fieldGroup}>
            <legend className={styles.legend}>夕べの睡眠</legend>
            <div className={styles.flexRow}>
            <label className="flex items-center gap-2">
                寝つき:
                <select
                value={formData.sleep_quality}
                onChange={(e) => setFormData({ ...formData, sleep_quality: e.target.value })}
                className={styles.select}
                >
                <option value="good">良</option>
                <option value="bad">悪</option>
                </select>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={formData.woke_up_night}
                onChange={(e) => setFormData({ ...formData, woke_up_night: e.target.checked })}
                />
                途中で起きなかった
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={formData.morning_refreshed}
                onChange={(e) => setFormData({ ...formData, morning_refreshed: e.target.checked })}
                />
                起床時爽快感あり
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
                <input
                type="checkbox"
                checked={formData.daytime_sleepiness}
                onChange={(e) => setFormData({ ...formData, daytime_sleepiness: e.target.checked })}
                />
                日中の眠気あり
            </label>
            </div>
        </fieldset>

        {/* メモ */}
        <div className="mb-6">
            <label htmlFor="memo" className="block text-xs font-semibold mb-1">
            メモ
            </label>
            <input
            id="memo"
            type="text"
            value={formData.memo}
            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
            placeholder="ひとことメモ（自由記入）"
            className={styles.input}
            />
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? "保存中..." : "記録を保存する"}
        </button>
        </form>
    );
}