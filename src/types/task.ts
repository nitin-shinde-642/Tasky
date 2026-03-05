export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: number;
  completedAt: number | null;
}

export type FilterOption = 'All' | 'Completed' | 'Pending';
