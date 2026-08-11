import RecordForm from "@/components/features/records/RecordForm";

export default function Home() {
  return (
    <main style={{ padding: "40px 16px", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "24px", color: "#111827", fontSize: "1.5rem", fontWeight: "bold" }}>
          生活リズム管理アプリ
        </h1>
        {/* 作成したフォームを表示 */}
        <RecordForm />
      </div>
    </main>
  );
}