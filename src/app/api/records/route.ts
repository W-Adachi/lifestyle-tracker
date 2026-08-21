import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        // 1. フォーム（画面）から送られてきたデータを受け取る
        const body = await request.json();
        const { date, wakeUpTime, sleepTime, condition, memo } = body;

        // 2. Google API の認証設定
        const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            // 改行コード（\n）を正常に解釈させるための処理
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        // 3. スプレッドシートへ1行追加（Append）
        const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: "シート1!A:E", // ※スプレッドシートのタブ名が「シート1」でない場合は適宜変更してください
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[date, wakeUpTime, sleepTime, condition, memo]],
        },
        });

        return NextResponse.json({ success: true, data: response.data });
    } catch (error) {
        console.error("スプレッドシート書き込みエラー:", error);
        return NextResponse.json(
        { success: false, error: "データの保存に失敗しました" },
        { status: 500 }
        );
    }
}
export async function GET() {
    try {
        const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        const sheets = google.sheets({ version: "v4", auth });

        // スプレッドシートからA2〜Eの範囲（ヘッダー以下）を取得
        const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: "シート1!A2:E",
        });

        const rows = response.data.values || [];

        // 日付（1列目）が入っている行だけを対象にし、空行スキップ＆安全に整形
        const records = rows
        .filter((row) => row && row[0] && row[0].trim() !== "") // 日付が空の行（空行）を除外
        .map((row, index) => ({
            id: index + 1,
            date: row[0] || "",
            wakeTime: row[1] || "",
            bedTime: row[2] || "",
            mood: row[3] || "",
            memo: row[4] || "",
        }));

        return NextResponse.json({ records }, { status: 200 });
    } catch (error: any) {
        console.error("GET Error Details:", error);
        return NextResponse.json(
        { error: "データの取得に失敗しました", details: error.message },
        { status: 500 }
        );
    }
}