"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await fetch("/api/records");
      const data = await res.json();
      
      if (res.ok) {
        setRecords(data.records || []);
      } else {
        setErrorMessage(data.error || "データの取得に失敗しました");
      }
    } catch (error) {
      console.error("データ取得エラー:", error);
      setErrorMessage("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <main className="records-container">
      <div className="records-header">
        <h1 className="records-title">過去の生活記録</h1>
        <Link href="/" className="back-button">
          ⬅ 記録をつける
        </Link>
      </div>

      <section className="records-card">
        {loading ? (
          <p className="status-message">読み込み中...</p>
        ) : errorMessage ? (
          <p className="error-message">{errorMessage}</p>
        ) : records.length === 0 ? (
          <p className="status-message">まだ記録がありません。</p>
        ) : (
          <div className="table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>起床</th>
                  <th>就寝</th>
                  <th>気分</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                {records.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.date}</td>
                    <td>{item.wakeTime}</td>
                    <td>{item.bedTime}</td>
                    <td>{item.mood}</td>
                    <td className="memo-cell">{item.memo}</td>
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