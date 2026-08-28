import RecordForm from "@/components/features/record-form/RecordForm";

export default function Home() {
  return (
    <main style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", textAlign: "right" }}>
        <a
          href="/records"
          style={{
            display: "inline-block",
            padding: "8px 16px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "0.9rem",
          }}
        >
          📊 履歴・グラフ・PDFレポートを見る →
        </a>
      </div>

      <h1 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>生活リズム入力</h1>
      <RecordForm />
    </main>
  );
}