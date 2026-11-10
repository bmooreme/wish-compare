<?php

use Illuminate\Support\Facades\Schedule;

/*
| Shared hosting has no long-running queue worker, so a single cron entry
| runs the scheduler every minute and the scheduler drains the queue
| (confirmation and notification emails) without overlapping itself.
|
|   * * * * * cd /path/to/tappylist && php artisan schedule:run >> /dev/null 2>&1
*/
Schedule::command('queue:work --stop-when-empty --max-time=50 --tries=3')
    ->everyMinute()
    ->withoutOverlapping(5);

Schedule::command('queue:prune-failed --hours=168')->daily();
