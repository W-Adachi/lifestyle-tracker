import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercelでの静的キャッシュを無効化し、常に動的実行させる
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET: 記録一覧の取得
export async function GET() {
    try {
        const { data, error } = await supabase
        .from("records")
        .select("*")
        .order("created_at", { ascending: false });

        if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, {
        headers: {
            "Cache-Control": "no-store, max-age=0",
        },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
    }

    // POST: 記録の保存
    export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { data, error } = await supabase
        .from("records")
        .insert([body])
        .select();

        if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}