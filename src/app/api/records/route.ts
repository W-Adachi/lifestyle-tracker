import { google } from "googleapis";
import { NextResponse } from "next/server";

// Google API認証用の共通処理
function getGoogleAuth() {
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
    
    // Vercel上の \n (文字列) を実際の改行コードに確実に変換する処理
    const privateKey = rawKey
        .replace(/^"(.*)"$/, "$1") // 前後のダブルクォーテーションを削除
        .replace(/\\n/g, "\n");   // \n を実際の改行に置換

    return new google.auth.GoogleAuth({
        credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    }

    export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, wakeUpTime, sleepTime, condition, memo } = body;

        const auth = getGoogleAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: "シート1!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
            values: [[date, wakeUpTime, sleepTime, condition, memo]],
        },
        });

        return NextResponse.json({ success: true, data: response.data });
    } catch (error: any) {
        console.error("POST Error Details:", error);
        return NextResponse.json(
        { success: false, error: "データの保存に失敗しました", details: error.message },
        { status: 500 }
        );
    }
    }

    export async function GET() {
    try {
        const auth = getGoogleAuth();
        const sheets = google.sheets({ version: "v4", auth });

        const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: "シート1!A2:E",
        });

        const rows = response.data.values || [];

        const records = rows
        .filter((row) => row && row[0] && row[0].trim() !== "")
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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rowIndex = searchParams.get("rowIndex"); // 消したい行番号（例: 2）

        if (!rowIndex) {
        return NextResponse.json({ error: "行番号が指定されていません" }, { status: 400 });
        }

        const auth = getGoogleAuth();
        const sheets = google.sheets({ version: "v4", auth });

        // 指定された行の値（A列〜E列）をクリア（削除）
        await sheets.spreadsheets.values.clear({
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        range: `シート1!A${rowIndex}:E${rowIndex}`,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE Error Details:", error);
        return NextResponse.json(
        { error: "データの削除に失敗しました", details: error.message },
        { status: 500 }
        );
    }
}