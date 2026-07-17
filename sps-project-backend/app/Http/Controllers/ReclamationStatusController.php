<?php

namespace App\Http\Controllers;

use App\Exceptions\ReclamationDomainException;
use App\Http\Controllers\Concerns\HandlesReclamationDomainErrors;
use App\Http\Requests\CancelReclamationRequest;
use App\Http\Requests\ChangeReclamationStatusRequest;
use App\Http\Resources\ReclamationResource;
use App\Models\Reclamation;
use App\Services\ReclamationService;
use Illuminate\Support\Facades\Auth;

class ReclamationStatusController extends Controller
{
    use HandlesReclamationDomainErrors;

    public function __construct(private readonly ReclamationService $service)
    {
    }

    public function update(
        ChangeReclamationStatusRequest $request,
        Reclamation $reclamation
    ): ReclamationResource {
        try {
            return new ReclamationResource(
                $this->service->changeStatus($reclamation, $request->validated(), Auth::id())
            );
        } catch (ReclamationDomainException $exception) {
            abort($this->domainError($exception));
        }
    }

    public function cancel(
        CancelReclamationRequest $request,
        Reclamation $reclamation
    ): ReclamationResource {
        try {
            return new ReclamationResource(
                $this->service->cancel($reclamation, $request->validated('motif'), Auth::id())
            );
        } catch (ReclamationDomainException $exception) {
            abort($this->domainError($exception));
        }
    }
}
