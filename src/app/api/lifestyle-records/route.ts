import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 一覧取得 (GET)
export async function GET() {
    try {
        const { data, error } = await supabase
        .from("records")
        .select("*")
        .order("date", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ records: data }, { status: 200 });
    } catch (error: any) {
        console.error("GET Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    }

    // 新規登録 (POST)
    export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { data, error } = await supabase
        .from("records")
        .insert([body])
        .select();

        if (error) throw error;

        return NextResponse.json({ success: true, record: data }, { status: 200 });
    } catch (error: any) {
        console.error("POST Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    }

    // 削除 (DELETE)
    export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
        return NextResponse.json({ error: "IDが指定されていません" }, { status: 400 });
        }

        const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("DELETE Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}