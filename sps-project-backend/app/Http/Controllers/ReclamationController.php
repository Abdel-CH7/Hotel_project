<?php

namespace App\Http\Controllers;

use App\Exceptions\ReclamationDomainException;
use App\Http\Controllers\Concerns\HandlesReclamationDomainErrors;
use App\Http\Requests\StoreReclamationRequest;
use App\Http\Requests\UpdateReclamationRequest;
use App\Http\Resources\ReclamationResource;
use App\Http\Resources\ReclamationSummaryResource;
use App\Models\Reclamation;
use App\Services\ReclamationService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReclamationController extends Controller
{
    use HandlesReclamationDomainErrors;

    public function __construct(private readonly ReclamationService $service)
    {
    }

    public function index(): AnonymousResourceCollection
    {
        $rows = Reclamation::query()
            ->with([
                'type:id,nom,actif',
                'canal:id,nom,actif,est_autre',
                'departement:id,nom,actif',
                'reservation:id,reservation_num',
                'chambre:id,num_chambre,type_chambre_id,etage_id,vue_id',
                'chambre.typeChambre:id,type_chambre',
                'chambre.etage:id,etage',
                'chambre.vue:id,vue',
                'client',
            ])
            ->withCount('historique')
            ->orderByDesc('date_reclamation')
            ->orderByDesc('id')
            ->get();

        return ReclamationSummaryResource::collection($rows);
    }

    public function show(Reclamation $reclamation): ReclamationResource
    {
        return new ReclamationResource($this->service->loadDetail($reclamation));
    }

    public function store(StoreReclamationRequest $request): JsonResponse
    {
        try {
            return (new ReclamationResource(
                $this->service->create($request->validated(), Auth::id())
            ))->response()->setStatusCode(201);
        } catch (ReclamationDomainException $exception) {
            abort($this->domainError($exception));
        }
    }

    public function update(
        UpdateReclamationRequest $request,
        Reclamation $reclamation
    ): ReclamationResource {
        try {
            return new ReclamationResource(
                $this->service->update($reclamation, $request->validated(), Auth::id())
            );
        } catch (ReclamationDomainException $exception) {
            abort($this->domainError($exception));
        }
    }
}
