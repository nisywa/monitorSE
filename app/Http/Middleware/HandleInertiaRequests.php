<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id'    => $request->user()->id,
                    'nama'  => $request->user()->nama,
                    'email' => $request->user()->email,
                    'role'  => $request->user()->role,
                    'pcl'   => $request->user()->pcl ? [
                        'id' => $request->user()->pcl->id,
                        'asal_kecamatan' => $request->user()->pcl->asal_kecamatan,
                        'desa' => $request->user()->pcl->desa,
                        'sls' => $request->user()->pcl->sls,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
        ];
    }
}
