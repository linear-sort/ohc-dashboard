export const OHC_ACTIONS = [
  "list_tasks",
  "add_tasks",
  "identify_hash",
  "list_wordlists",
] as const;

export type OhcAction = (typeof OHC_ACTIONS)[number];

export type TaskBatchBucket = {
  count: number;
  reason?: string;
  hashes: string[];
  message?: string;
};

export type PendingHash = {
  hash: string;
  reasons: Array<"pending_tier" | "pending_quota">;
};

export type PendingTaskBatchBucket = {
  count: number;
  hashes: PendingHash[];
};

export type TaskItem = {
  created_at: string;
  hash: string;
  algomode: string;
  algorithm: string;
  usernote: string;
  status: string;
  lastAttack: string;
  cleartext_location?: string;
  pending_tier_upgrade?: boolean;
  pending_quota_upgrade?: boolean;
};

export type Wordlist = {
  name: string;
  count: number;
  size_bytes: number;
  size_gb: number;
  created_at: string;
};

export type WordlistQuota = {
  unlimited: boolean;
  used_bytes: number;
  max_bytes: number | null;
  remaining_bytes: number | null;
  upgrade_url?: string | null;
};

export type AddTasksResponse = {
  success: true;
  accepted: TaskBatchBucket;
  pending: PendingTaskBatchBucket;
  skipped: TaskBatchBucket;
  rejected: TaskBatchBucket;
  request_id: string;
};

export type ListTasksResponse = {
  success: true;
  tasks: TaskItem[];
  wordlists: Wordlist[];
  wordlist_quota: WordlistQuota;
  request_id: string;
};

export type HashIdentification = {
  hash: string;
  candidates: Array<{ algo_mode: number; name: string }>;
  ambiguous: boolean;
};

export type IdentifyHashResponse = {
  success: true;
  hashes: HashIdentification[];
  request_id: string;
};

export type ListWordlistsResponse = {
  success: true;
  wordlists: Wordlist[];
  wordlist_quota: WordlistQuota;
  request_id: string;
};

export type OhcSuccessResponse =
  | AddTasksResponse
  | ListTasksResponse
  | IdentifyHashResponse
  | ListWordlistsResponse;

export type OhcErrorBody = {
  success: false;
  error_code: string;
  message: string;
  request_id: string;
  retry_after?: number;
  limit?: number;
  missing?: string[];
  unknown?: string[];
};

export type ClientAddTasksInput = {
  action: "add_tasks";
  algo_mode: number;
  hashes: string[];
};

export type ClientListTasksInput = {
  action: "list_tasks";
};

export type ClientIdentifyHashInput = {
  action: "identify_hash";
  hashes: string[];
};

export type ClientListWordlistsInput = {
  action: "list_wordlists";
};

export type ClientOhcInput =
  | ClientAddTasksInput
  | ClientListTasksInput
  | ClientIdentifyHashInput
  | ClientListWordlistsInput;
