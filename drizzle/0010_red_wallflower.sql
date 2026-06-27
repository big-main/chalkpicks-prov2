ALTER TABLE `subscription_orders` MODIFY COLUMN `tier` enum('trial','credit','daily','monthly','yearly') NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `subscriptionTier` enum('free','trial','daily','monthly','yearly') NOT NULL DEFAULT 'free';--> statement-breakpoint
ALTER TABLE `users` ADD `accountBalance` decimal(10,2) DEFAULT '0' NOT NULL;