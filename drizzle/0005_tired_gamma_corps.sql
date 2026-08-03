CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`action` text NOT NULL,
	`old_values` text,
	`new_values` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `deleted_at` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `deleted_at` text;