CREATE TABLE `storage_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`total_bytes` integer DEFAULT 0 NOT NULL,
	`blob_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
