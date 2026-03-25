CREATE TABLE `memorization_card` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`verse_key` text NOT NULL,
	`ease_factor` real DEFAULT 2.5 NOT NULL,
	`repetition` integer DEFAULT 0 NOT NULL,
	`interval` integer DEFAULT 0 NOT NULL,
	`next_review_date` integer NOT NULL,
	`confidence` text DEFAULT 'learning' NOT NULL,
	`total_reviews` integer DEFAULT 0 NOT NULL,
	`correct_reviews` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mc_user_verse_idx` ON `memorization_card` (`user_id`,`verse_key`);--> statement-breakpoint
CREATE INDEX `mc_user_review_idx` ON `memorization_card` (`user_id`,`next_review_date`);--> statement-breakpoint
CREATE TABLE `memorization_goals` (
	`user_id` text PRIMARY KEY NOT NULL,
	`new_cards_per_day` integer DEFAULT 5 NOT NULL,
	`review_cards_per_day` integer DEFAULT 20 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `review_entry` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`verse_key` text NOT NULL,
	`grade` integer NOT NULL,
	`previous_ease_factor` real NOT NULL,
	`new_ease_factor` real NOT NULL,
	`previous_interval` integer NOT NULL,
	`new_interval` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `re_user_reviewed_idx` ON `review_entry` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE TABLE `user_badge` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`badge_id` text NOT NULL,
	`unlocked_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ub_user_badge_idx` ON `user_badge` (`user_id`,`badge_id`);--> statement-breakpoint
CREATE TABLE `user_stats` (
	`user_id` text PRIMARY KEY NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_review_date` integer,
	`total_sevap_point` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
