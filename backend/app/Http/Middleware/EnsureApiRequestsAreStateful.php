<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class EnsureApiRequestsAreStateful
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Config::set('sanctum.stateful', array_merge(
            Config::get('sanctum.stateful', []),
            ['localhost', '127.0.0.1', '::1']
        ));

        try {
            return $next($request);
        } catch (\Illuminate\Auth\AuthenticationException $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'authenticated' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
            throw $e;
        }
    }
}
