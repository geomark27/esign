<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\BankPaymentDetail;
use App\Models\CardPaymentDetail;
use App\Models\CashPaymentDetail;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Exception;

class PaymentController extends Controller
{
    /**
     * Constructor para aplicar middleware si es necesario.
     */
    public function __construct()
    {
        // Por ejemplo, para proteger todas las rutas de este controlador:
        // $this->middleware('auth:api');
    }

    /**
     * Muestra una lista paginada de pagos con filtros.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Payment::query()->with(['detailable', 'certification']);

        // --- Aplicando Filtros ---
        // Filtrar por estado
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filtrar por rango de fechas
        if ($request->has('date_from')) {
            $query->whereDate('payment_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('payment_date', '<=', $request->date_to);
        }

        // Filtrar por ID de certificación
        if ($request->has('certification_id')) {
            $query->where('certification_id', $request->certification_id);
        }

        $payments = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($payments);
    }

    /**
     * Almacena un nuevo pago en la base de datos.
     * Este es el método más complejo, ya que maneja la lógica para cada tipo de pago.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Validación común para todos los tipos de pago
        $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method_code' => 'required|string|exists:payment_methods,name',
        ]);

        try {
            $payment = null;
            // Usamos una transacción para asegurar la integridad de los datos.
            // Si algo falla, se revierte toda la operación.
            DB::transaction(function () use ($request, &$payment) {
                $paymentDetail = null;

                // --- Lógica según el método de pago ---
                switch ($request->payment_method_code) {
                    case 'cash':
                        $request->validate(['received_amount' => 'required|numeric|min:' . $request->amount]);
                        $paymentDetail = CashPaymentDetail::create([
                            'received_amount' => $request->received_amount,
                            'change_given' => $request->received_amount - $request->amount,
                        ]);
                        break;

                    case 'credit_card':
                    case 'debit_card':
                        $request->validate([
                            'last_four_digits' => 'required|digits:4',
                            'card_brand' => 'required|string',
                            'authorization_code' => 'nullable|string',
                        ]);
                        $paymentDetail = CardPaymentDetail::create($request->only([
                            'transaction_code', 'authorization_code', 'card_brand', 'last_four_digits', 'installments'
                        ]));
                        break;

                    case 'transfer':
                    case 'deposit':
                        $request->validate([
                            'reference_number' => 'required|string|unique:bank_payment_details,reference_number',
                            'transaction_date' => 'required|date',
                            'destination_bank_account' => 'required|string',
                        ]);
                        $paymentDetail = BankPaymentDetail::create([
                            'type' => $request->payment_method_code,
                            'destination_bank_account' => $request->destination_bank_account,
                            'reference_number' => $request->reference_number,
                            'transaction_date' => $request->transaction_date,
                            'origin_bank' => $request->origin_bank,
                        ]);
                        break;
                    
                    default:
                        throw new Exception("Método de pago no soportado.");
                }

                // --- Creación del Pago Principal ---
                $status = ($request->payment_method_code === 'transfer' || $request->payment_method_code === 'deposit')
                    ? Payment::STATUS_PENDING
                    : Payment::STATUS_VERIFIED;

                $payment = $paymentDetail->payment()->create([
                    'certification_id' => $request->certification_id,
                    'amount' => $request->amount,
                    'payment_date' => now(),
                    'status' => $status,
                    'notes' => $request->notes,
                ]);
            });

            return response()->json($payment->load('detailable'), 201);

        } catch (Exception $e) {
            return response()->json(['message' => 'Error al registrar el pago.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Muestra los detalles de un pago específico.
     *
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Payment $payment)
    {
        return response()->json($payment->load(['detailable', 'certification']));
    }

    /**
     * Devuelve los datos de un pago para ser editado.
     * En una API, esto es a menudo lo mismo que 'show'.
     *
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\JsonResponse
     */
    public function edit(Payment $payment)
    {
        return $this->show($payment);
    }

    /**
     * Actualiza información de un pago (ej. notas).
     * No debería permitir cambiar el monto o el tipo.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Payment $payment)
    {
        if ($payment->status === Payment::STATUS_VOIDED) {
            return response()->json(['message' => 'No se puede actualizar un pago anulado.'], 403);
        }

        $request->validate(['notes' => 'nullable|string']);
        $payment->update($request->only('notes'));

        return response()->json($payment->fresh()->load('detailable'));
    }

    /**
     * Anula un pago en lugar de borrarlo.
     * Los registros financieros no deben ser eliminados.
     *
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Payment $payment)
    {
        if ($payment->status === Payment::STATUS_VOIDED) {
            return response()->json(['message' => 'Este pago ya ha sido anulado.'], 409);
        }

        $payment->status = Payment::STATUS_VOIDED;
        $payment->notes = ($payment->notes ? $payment->notes . "\n" : '') . "Pago anulado el " . now()->toDateTimeString();
        $payment->save();

        return response()->json(['message' => 'Pago anulado correctamente.']);
    }

    // --- MÉTODOS ADICIONALES NECESARIOS ---

    /**
     * Obtiene los datos necesarios para los formularios de creación/edición de pagos.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPaymentFormData()
    {
        return response()->json([
            'payment_methods' => PaymentMethod::where('is_active', true)->get(['name', 'display_name']),
            'payment_statuses' => Payment::STATUS_OPTIONS,
        ]);
    }

    /**
     * Actualiza el estado de un pago (ej. de 'pending' a 'verified').
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Payment  $payment
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateStatus(Request $request, Payment $payment)
    {
        $request->validate([
            'status' => ['required', Rule::in(array_keys(Payment::STATUS_OPTIONS))],
            'notes' => 'nullable|string',
        ]);

        if ($payment->status === Payment::STATUS_VOIDED) {
            return response()->json(['message' => 'No se puede cambiar el estado de un pago anulado.'], 403);
        }

        $payment->status = $request->status;
        if ($request->has('notes')) {
            $payment->notes = ($payment->notes ? $payment->notes . "\n" : '') . "Nota de estado: " . $request->notes;
        }
        $payment->save();

        return response()->json($payment->fresh()->load('detailable'));
    }
}
