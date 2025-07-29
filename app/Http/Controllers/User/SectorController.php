<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SectorController extends Controller
{
    /**
     * Muestra una lista de todas las provincias con sus respectivas ciudades.
     * Esta es la página principal para la gestión de sectores.
     */
    public function index(): Response
    {
        try {
            // Usamos with('cities') para cargar las ciudades relacionadas y evitar el problema N+1.
            // Esto es mucho más eficiente que hacer una consulta por cada provincia.
            $provinces = Province::with('cities')->orderBy('name')->get();

            // Renderizamos el componente de Inertia y le pasamos las provincias como props.
            return Inertia::render('user/sectors/Index', [
                'provinces' => $provinces,
                // Pasamos los mensajes flash de la sesión (success, error) para mostrarlos en el frontend.
                'flash' => [
                    'success' => session('success'),
                    'error' => session('error'),
                ],
            ]);
        } catch (\Throwable $th) {
            Log::channel('debugging')->error('Error al cargar la página de sectores', ['error' => $th]);
            
            // En caso de error, retornamos una vista con provincias vacías
            return Inertia::render('user/sectors/Index', [
                'provinces' => [],
                'flash' => [
                    'error' => 'Error al cargar los sectores. Intenta recargar la página.',
                ],
            ]);
        }
    }

    /**
     * Muestra el formulario para crear una nueva ciudad.
     * Necesitamos pasar la lista de provincias para llenar un <select> en el formulario.
     */
    public function create(): Response
    {
        return Inertia::render('user/sectors/Create', [
            // Pasamos solo el id y el nombre para optimizar la carga de datos.
            'provinces' => Province::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Almacena una nueva ciudad en la base de datos.
     */
    public function store(Request $request)
    {
        // Usamos Validator manual para poder capturar los errores de validación
        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                // Regla de validación avanzada: el nombre debe ser único para esa provincia específica.
                Rule::unique('cities')->where(function ($query) use ($request) {
                    return $query->where('province_id', $request->province_id);
                }),
            ],
            'province_id' => 'required|exists:provinces,id',
        ], [
            // Mensajes de error personalizados.
            'name.unique' => 'Ya existe una ciudad con este nombre en la provincia seleccionada.',
            'province_id.exists' => 'La provincia seleccionada no es válida.',
        ]);

        // Detectar si la petición viene de Inertia o de axios/fetch
        $isInertiaRequest = $request->header('X-Inertia');
        
        // Si la validación falla
        if ($validator->fails()) {
            Log::channel('debugging')->info('Validación falló al crear ciudad', [
                'errors' => $validator->errors()->toArray(),
                'input' => $request->all(),
                'is_inertia' => $isInertiaRequest ? true : false
            ]);
            
            if ($isInertiaRequest) {
                // Para peticiones de Inertia (Index.tsx de sectors)
                return back()
                    ->withInput()
                    ->withErrors($validator->errors());
            } else {
                // Para peticiones AJAX (Create.tsx de certifications)
                return response()->json([
                    'message' => 'Los datos proporcionados no son válidos.',
                    'errors' => $validator->errors()
                ], 422);
            }
        }

        $validatedData = $validator->validated();

        DB::beginTransaction();
        try {
            $city = City::create($validatedData);
            DB::commit();
            
            Log::channel('debugging')->info('Ciudad creada correctamente', [
                'city' => $city,
                'is_inertia' => $isInertiaRequest ? true : false
            ]);
            
            if ($isInertiaRequest) {
                // Para peticiones de Inertia (Index.tsx de sectors)
                return back()->with('success', 'Ciudad creada correctamente.');
            } else {
                // Para peticiones AJAX (Create.tsx de certifications)
                return response()->json([
                    'message' => 'Ciudad creada correctamente.',
                    'city' => $city
                ], 201);
            }
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::channel('debugging')->error('Error al crear ciudad', ['error' => $th]);
            
            if ($isInertiaRequest) {
                // Para peticiones de Inertia (Index.tsx de sectors)
                return back()
                    ->withInput()
                    ->with('error', 'Error al crear la ciudad. Intenta nuevamente.');
            } else {
                // Para peticiones AJAX (Create.tsx de certifications)
                return response()->json([
                    'message' => 'Error al crear la ciudad. Intenta nuevamente.',
                    'error' => 'Error interno del servidor'
                ], 500);
            }
        }
    }

    /**
     * Muestra el formulario para editar una ciudad existente.
     */
    public function edit(City $sector): Response // Usamos Route Model Binding para inyectar el modelo City.
    {
        return Inertia::render('user/sectors/Edit', [
            'city' => $sector, // La ciudad que se va a editar.
            'provinces' => Province::orderBy('name')->get(['id', 'name']), // La lista de provincias para el <select>.
        ]);
    }

    /**
     * Actualiza una ciudad existente en la base de datos.
     */
    public function update(Request $request, City $sector) // Route Model Binding
    {
        // Validación similar a store, pero ignorando el ID de la ciudad actual en la regla 'unique'.
        $validatedData = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('cities')->where(function ($query) use ($request) {
                    return $query->where('province_id', $request->province_id);
                })->ignore($sector->id),
            ],
            'province_id' => 'required|exists:provinces,id',
        ], [
            // Mensajes de error personalizados.
            'name.unique' => 'Ya existe una ciudad con este nombre en la provincia seleccionada.',
            'province_id.exists' => 'La provincia seleccionada no es válida.',
        ]);

        DB::beginTransaction();
        try {
            $sector->update($validatedData);
            DB::commit();

            return back()->with('success', 'Ciudad actualizada correctamente.');
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::channel('debugging')->error('Error al actualizar ciudad', [
                'error' => $th,
                'city_id' => $sector->id,
                'data' => $validatedData
            ]);
            return back()
                ->withInput()
                ->with('error', 'Error al actualizar la ciudad. Intenta nuevamente.');
        }
    }

    /**
     * Elimina una ciudad de la base de datos.
     */
    public function destroy(City $sector) // Route Model Binding
    {
        DB::beginTransaction();
        try {
            $cityName = $sector->name; // Guardamos el nombre antes de eliminar para el mensaje
            $sector->delete();
            DB::commit();

            // Redirigimos a la página anterior con un mensaje de éxito.
            return back()->with('success', "Ciudad '{$cityName}' eliminada correctamente.");
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::channel('debugging')->error('Error al eliminar ciudad', [
                'error' => $th,
                'city_id' => $sector->id,
                'city_name' => $sector->name
            ]);
            return back()->with('error', 'Error al eliminar la ciudad. Intenta nuevamente.');
        }
    }

    /**
     * MÉTODO ADICIONAL: Endpoint de API para selects dinámicos.
     * Devuelve las ciudades de una provincia específica en formato JSON.
     * Muy útil para el frontend.
     */
    public function getCitiesByProvince(Request $request)
    {
        try {
            $request->validate(['province_id' => 'required|exists:provinces,id']);
            
            $cities = City::where('province_id', $request->province_id)
                         ->orderBy('name')
                         ->get(['id', 'name']);

            return response()->json($cities);
        } catch (\Throwable $th) {
            Log::channel('debugging')->error('Error al obtener ciudades por provincia', [
                'error' => $th,
                'province_id' => $request->province_id ?? null
            ]);
            return response()->json(['error' => 'Error al obtener las ciudades'], 500);
        }
    }
}
