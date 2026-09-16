import { createServiceClient } from '@/lib/supabase/service';

export type TableConfig = {
  number: number;
  seats: number;
  bookable: boolean;
  splittable: boolean;
  mergeable_with: number[];
};

export type TableAssignment = {
  id: string;
  reservation_id: string;
  reservation_date: string;
  table_numbers: number[];
  half: 'a' | 'b' | null;
};

// Config reads use the service client — this is restaurant configuration,
// not guest data, and every dashboard view needs it to render the grid.
export async function getTablesConfig(): Promise<TableConfig[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('bookable', true)
    .order('number');

  if (error) throw new Error(error.message);
  return (data ?? []) as TableConfig[];
}

export async function getAssignmentsForDate(date: string): Promise<TableAssignment[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('table_assignments')
    .select('*')
    .eq('reservation_date', date);

  if (error) throw new Error(error.message);
  return (data ?? []) as TableAssignment[];
}

// Pure validation — no DB access — so it can run inside a session-authed
// server action without needing its own client.
export function validateAssignment(
  tables: TableConfig[],
  tableNumbers: number[],
  half: 'a' | 'b' | null
) {
  if (tableNumbers.length === 0) {
    throw new Error('Select at least one table.');
  }

  const selected = tableNumbers.map((n) => {
    const table = tables.find((t) => t.number === n);
    if (!table) throw new Error(`Table ${n} does not exist.`);
    if (!table.bookable) throw new Error(`Table ${n} is not bookable.`);
    return table;
  });

  if (half && (tableNumbers.length !== 1 || !selected[0].splittable)) {
    throw new Error('A half assignment must target exactly one splittable table.');
  }

  if (tableNumbers.length > 1) {
    for (const table of selected) {
      const others = tableNumbers.filter((n) => n !== table.number);
      const missing = others.filter((n) => !table.mergeable_with.includes(n));
      if (missing.length > 0) {
        throw new Error(`Table ${table.number} can't be merged directly with ${missing.join(', ')}.`);
      }
    }
  }
}