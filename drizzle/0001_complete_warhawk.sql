CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`lessonCount` int NOT NULL,
	`certNumber` varchar(30) NOT NULL,
	`pdfKey` varchar(500),
	`pdfUrl` varchar(1000),
	`emailSent` boolean NOT NULL DEFAULT false,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_registrationId_unique` UNIQUE(`registrationId`),
	CONSTRAINT `certificates_certNumber_unique` UNIQUE(`certNumber`)
);
--> statement-breakpoint
CREATE TABLE `course_content_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`moduleId` int NOT NULL,
	`lessonTitle` varchar(255) NOT NULL,
	`sectionTitle` varchar(255),
	`chunkType` varchar(50) NOT NULL,
	`content` text NOT NULL,
	`keywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `course_content_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_extra_exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`exercise` varchar(1000) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_extra_exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_extra_key_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`point` varchar(500) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_extra_key_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_extra_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`highlight` varchar(500),
	`source` text,
	`sourceUrl` varchar(1000),
	`sortOrder` int NOT NULL DEFAULT 0,
	`isVisible` boolean NOT NULL DEFAULT true,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_extra_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_positions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`lessonId` int NOT NULL,
	`positionSeconds` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_positions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`lessonId` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lesson_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`updateType` enum('section','keyPoint','exercise') NOT NULL,
	`title` varchar(500),
	`body` text,
	`highlight` varchar(500),
	`source` text,
	`sourceUrl` varchar(1000),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewNote` text,
	`researchedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_exam_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`moduleId` int NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL,
	`answers` text,
	`attemptNumber` int NOT NULL DEFAULT 1,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `module_exam_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pronunciation_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originalWord` varchar(255) NOT NULL,
	`replacement` varchar(255) NOT NULL,
	`note` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pronunciation_overrides_id` PRIMARY KEY(`id`),
	CONSTRAINT `pronunciation_overrides_originalWord_unique` UNIQUE(`originalWord`)
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`token` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`unsubscribedAt` timestamp,
	`lastEmailSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `registrations_email_unique` UNIQUE(`email`),
	CONSTRAINT `registrations_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `research_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`status` enum('running','completed','failed') NOT NULL DEFAULT 'running',
	`proposalsCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `research_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `satisfaction_surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`overallRating` int NOT NULL,
	`contentRating` int NOT NULL,
	`presentationRating` int NOT NULL,
	`practicalRating` int NOT NULL,
	`wouldRecommend` boolean NOT NULL,
	`favoriteLesson` varchar(255),
	`improvements` text,
	`freeText` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `satisfaction_surveys_id` PRIMARY KEY(`id`),
	CONSTRAINT `satisfaction_surveys_registrationId_unique` UNIQUE(`registrationId`)
);
--> statement-breakpoint
CREATE TABLE `tts_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rate` varchar(10) NOT NULL DEFAULT '0.88',
	`pitch` varchar(10) NOT NULL DEFAULT '1.02',
	`sentencePause` int NOT NULL DEFAULT 220,
	`commaPause` int NOT NULL DEFAULT 100,
	`prefixPause` int NOT NULL DEFAULT 180,
	`mergeSpacedLetters` tinyint NOT NULL DEFAULT 1,
	`stripNikudForTts` tinyint NOT NULL DEFAULT 1,
	`provider` varchar(20) NOT NULL DEFAULT 'openai',
	`voice` varchar(30) NOT NULL DEFAULT 'nova',
	`model` varchar(20) NOT NULL DEFAULT 'tts-1',
	`openaiSpeed` varchar(10) NOT NULL DEFAULT '1.0',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tts_settings_id` PRIMARY KEY(`id`)
);
