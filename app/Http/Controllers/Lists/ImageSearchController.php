<?php

namespace App\Http\Controllers\Lists;

use App\Http\Controllers\Controller;
use App\Services\Images\ProductImageSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImageSearchController extends Controller
{
    public function __invoke(Request $request, ProductImageSearch $images): JsonResponse
    {
        abort_unless($images->enabled(), 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'identifier' => ['nullable', 'string', 'max:32'],
        ]);

        return response()->json([
            'query' => $images->queryFrom($data['title']),
            'candidates' => $images->search($data['title'], $data['identifier'] ?? null),
        ]);
    }
}
