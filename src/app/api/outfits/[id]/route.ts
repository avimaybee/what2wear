import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(_request: NextRequest, context: { params: Promise<Record<string, string>> }) {
  const supabase = await createClient();

  const resolvedParams = await context.params;
  const { id } = resolvedParams;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const outfitId = Number(id);
  if (!Number.isFinite(outfitId)) {
    return NextResponse.json({ success: false, error: 'Invalid outfit id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('outfits')
    .delete()
    .eq('id', outfitId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to delete outfit', error);
    return NextResponse.json({ success: false, error: 'Failed to delete outfit' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
