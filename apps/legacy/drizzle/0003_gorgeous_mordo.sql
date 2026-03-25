CREATE TABLE `annotation_page` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`strokes` text DEFAULT '[]' NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ap_user_page_idx` ON `annotation_page` (`user_id`,`page_number`);--> statement-breakpoint
CREATE TABLE `text_note` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verse_key` text NOT NULL,
	`page_number` integer NOT NULL,
	`content` text NOT NULL,
	`color` text DEFAULT '#dc2626' NOT NULL,
	`position_x` real DEFAULT 0.5 NOT NULL,
	`position_y` real DEFAULT 0.5 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tn_user_page_idx` ON `text_note` (`user_id`,`page_number`);--> statement-breakpoint
CREATE INDEX `tn_user_verse_idx` ON `text_note` (`user_id`,`verse_key`);