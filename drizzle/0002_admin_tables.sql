-- Migration: Add admin_activity_log and admin_password_reset_tokens tables
CREATE TABLE IF NOT EXISTS `admin_activity_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `action` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `ipAddress` varchar(50),
  `userAgent` text,
  `details` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `admin_activity_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `admin_password_reset_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `admin_password_reset_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `admin_password_reset_tokens_token_unique` UNIQUE(`token`)
);
