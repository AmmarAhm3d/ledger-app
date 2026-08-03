PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`account_id` integer NOT NULL,
	`category_id` integer,
	`is_transfer` integer DEFAULT false NOT NULL,
	`has_receipt` integer DEFAULT false NOT NULL,
	`receipt_url` text,
	`user_id` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "amount", "date", "description", "account_id", "category_id", "is_transfer", "has_receipt", "receipt_url", "user_id", "created_at", "updated_at") SELECT "id", "amount", "date", "description", "account_id", "category_id", false, "has_receipt", "receipt_url", "user_id", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;