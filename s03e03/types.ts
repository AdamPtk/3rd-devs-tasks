export interface DatabaseResponse {
  success: boolean;
  reply: any[];
  error?: string;
}

export interface TableStructure {
  table: string;
  structure: string;
} 