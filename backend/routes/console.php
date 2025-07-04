<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Console\Scheduling\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// === スケジューラ設定 ===
try {
    if (!app()->environment('testing')) {
        Artisan::schedule(function (Schedule $schedule) {
            $schedule->command('posts:publish-scheduled')->everyMinute();
        });
    }
} catch (\Throwable $e) {
    // テストや一部環境ではschedule()が呼べない場合があるため無視
}
