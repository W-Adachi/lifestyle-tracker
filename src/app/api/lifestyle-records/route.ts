import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
        .order("date", { ascending: false });

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

// PUT: 記録の編集・更新
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
        return NextResponse.json({ error: "IDが指定されていません" }, { status: 400 });
        }

        const { data, error } = await supabase
        .from("records")
        .update(updateData)
        .eq("id", id)
        .select();

        if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: レコードの削除
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
        return NextResponse.json(
            { error: "IDが指定されていません" },
            { status: 400 }
        );
        }

        const { error } = await supabase
        .from("records")
        .delete()
        .eq("id", id);

        if (error) {
        throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}