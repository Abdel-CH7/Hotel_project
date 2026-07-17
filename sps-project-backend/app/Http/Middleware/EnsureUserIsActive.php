<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isActive()) {
            return response()->json([
                'message' => 'Votre compte est désactivé. Contactez un administrateur.',
                'code' => 'account_inactive',
            ], 403);
        }

        return $next($request);
    }
}
