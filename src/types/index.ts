// 生活リズム記録の1件分の型定義
export type LifeRecord = {
    id?: string;
    date: string;          // 日付 (例: "2026-08-11")
    wakeUpTime: string;    // 起床時間 (例: "07:00")
    sleepTime: string;     // 就寝時間 (例: "23:00")
    condition: number;     // 体調・気分 (1〜5の5段階)
    memo: string;          // メモ・一言コメント
};