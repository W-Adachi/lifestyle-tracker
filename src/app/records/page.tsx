"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// スプレッドシートから受け取るデータの型定義
type RecordItem = {
    id: number;
    date: string;
    wakeTime: string;
    bedTime: string;
    mood: string;
    memo: string;
    };

    export default function RecordsPage() {
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // API (/api/records) からデータを取得する処理
    const fetchRecords = async () => {
        try {
        setLoading(true);
        const res = await fetch("/api/records");
        const data = await res.json();
        if (res.ok) {
            setRecords(data.records || []);
        }
        } catch (error) {
        console.error("データの取得に失敗しました", error);
        } finally {
        setLoading(false);
        }
    };

    // 画面が開いたときに自動でデータを読み込む
    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <main className="min-h-screen p-4 max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center my-4">
            <h1 className="text-2xl font-bold">過去の生活記録</h1>
            <Link
            href="/"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition"
            >
            ⬅ 記録をつける
            </Link>
        </div>

        <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            {loading ? (
            <p className="text-gray-500 text-center py-4">読み込み中...</p>
            ) : records.length === 0 ? (
            <p className="text-gray-500 text-center py-4">まだ記録がありません。</p>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b bg-gray-50 text-sm">
                    <th className="p-2">日付</th>
                    <th className="p-2">起床</th>
                    <th className="p-2">就寝</th>
                    <th className="p-2">気分</th>
                    <th className="p-2">メモ</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="p-2 whitespace-nowrap font-medium">{item.date}</td>
                        <td className="p-2 whitespace-nowrap">{item.wakeTime}</td>
                        <td className="p-2 whitespace-nowrap">{item.bedTime}</td>
                        <td className="p-2 whitespace-nowrap">{item.mood}</td>
                        <td className="p-2 min-w-[150px]">{item.memo}</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </section>
        </main>
    );
}