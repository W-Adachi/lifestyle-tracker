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
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
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