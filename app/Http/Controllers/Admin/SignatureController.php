<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use App\Models\Signature;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SignatureController extends Controller
{
    public function index(Request $request)
    {
        $query = Signature::query();

        // Filtros (igual que antes)
        $query->when($request->input('search'), function ($q, $search) {
            $q->where('display_name', 'like', "%{$search}%")
              ->orWhere('period', 'like', "%{$search}%");
        });
        
        $query->when($request->input('sort', 'created_at_desc'), function ($q, $sort) {
            match ($sort) {
                'price_asc' => $q->orderBy('price', 'asc'),
                'price_desc' => $q->orderBy('price', 'desc'),
                'name_asc' => $q->orderBy('display_name', 'asc'),
                'name_desc' => $q->orderBy('display_name', 'desc'),
                default => $q->orderBy('created_at', 'desc'),
            };
        });

        $signatures = $query->paginate(10)->withQueryString();

        return Inertia::render('admin/signatures/Index', [
            'signatures' => $signatures,
            'filters' => $request->only(['search', 'sort']),
        ]);
    }

    // ... (Los métodos store, update, destroy se mantienen similares)
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'period' => 'required|string|unique:signatures,period|max:50',
            'cost' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'display_name.required' => 'El nombre del plan es obligatorio.',
            'period.required' => 'El período del plan es obligatorio.',
            'period.unique' => 'El período ya existe.',
            'cost.required' => 'El costo del plan es obligatorio.',
            'price.required' => 'El precio del plan es obligatorio.',
        ]);

        Signature::create($validated);

        return redirect()->route('admin.signatures.index')
            ->with('success', 'Signature creado exitosamente.'); // Usamos with() para el flash message
    }

    public function update(Request $request, Signature $plan)
    {
        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'period' => 'required|string|max:50|unique:signatures,period,' . $plan->id,
            'cost' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'display_name.required' => 'El nombre del plan es obligatorio.',
            'period.required' => 'El período del plan es obligatorio.',
            'period.unique' => 'El período ya existe.',
            'cost.required' => 'El costo del plan es obligatorio.',
            'price.required' => 'El precio del plan es obligatorio.',
        ]);

        $plan->update($validated);

        return redirect()->back()->with('success', 'Signature actualizado exitosamente.');
    }

    public function changeStatus(Signature $plan)
    {
        $plan->is_active = !$plan->is_active;
        $plan->save();

        $message = $plan->is_active ? 'Firma activada.' : 'Firma desactivada';

        return redirect()->back()->with('success', $message);
    }
}