CREATE TABLE `learn_concept` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`incorrect_count` integer DEFAULT 0 NOT NULL,
	`mastery_level` integer DEFAULT 0 NOT NULL,
	`next_review_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lc_user_concept_idx` ON `learn_concept` (`user_id`,`concept_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`stage_id` integer NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'not_started' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`sevap_point_earned` integer DEFAULT 0 NOT NULL,
	`completed_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lp_user_lesson_idx` ON `lesson_progress` (`user_id`,`lesson_id`);--> statement-breakpoint
CREATE INDEX `lp_user_stage_idx` ON `lesson_progress` (`user_id`,`stage_id`);--> statement-breakpoint
CREATE TABLE `quest_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`quest_id` text NOT NULL,
	`words_correct` text DEFAULT '[]' NOT NULL,
	`total_attempts` integer DEFAULT 0 NOT NULL,
	`total_correct` integer DEFAULT 0 NOT NULL,
	`sessions_completed` integer DEFAULT 0 NOT NULL,
	`best_session_score` integer DEFAULT 0 NOT NULL,
	`last_played_at` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qp_user_quest_idx` ON `quest_progress` (`user_id`,`quest_id`);--> statement-breakpoint
CREATE TABLE `reading_history` (
	`user_id` text PRIMARY KEY NOT NULL,
	`last_surah_id` integer,
	`last_surah_name` text,
	`last_page_number` integer,
	`last_juz_number` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reading_list_item` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`item_id` integer NOT NULL,
	`added_at` integer NOT NULL,
	`last_read_at` integer,
	`deleted` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rli_user_type_item_idx` ON `reading_list_item` (`user_id`,`type`,`item_id`);--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
