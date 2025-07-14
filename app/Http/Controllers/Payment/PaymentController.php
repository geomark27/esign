<?php

namespace App\Http\Controllers\Payment;

use App\Exports\PaymentsExport;
use App\Http\Controllers\Controller;
use App\Models\BankPaymentDetail;
use App\Models\CardPaymentDetail;
use App\Models\CashPaymentDetail;
use App\Models\Certification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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

    public function store(Request $request)
    {
        $paymentMethodName = PaymentMethod::find($request->method_id)->name ?? null;
        $request->validate([
            'certification_id' => 'required|exists:certifications,id',
            'amount'           => 'required|numeric|min:0.01',
            'method_id'        => 'required|integer|exists:payment_methods,id',
            'receipt'          => [
                Rule::requiredIf(fn() => $paymentMethodName !== 'cash'),
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:1024' // Límite de 1MB.
            ],
        ], [
            'certification_id.required' => 'La certificación es obligatoria.',
            'amount.required'           => 'El monto es obligatorio.',
            'method_id.required'        => 'El método de pago es obligatorio.',
            'method_id.exists'          => 'El método de pago seleccionado no es válido.',
            'receipt.required'          => 'El comprobante de pago es obligatorio para este método.',
            'receipt.mimes'             => 'El comprobante debe ser una imagen (jpg, png) o un PDF.',
            'receipt.max'               => 'El comprobante no debe superar los 1MB.',
        ]);

        // 2. Verificación para evitar pagos duplicados.
        if (Payment::where('certification_id', $request->certification_id)->exists()) {
            return redirect()->back()->withErrors([
                'certification_id' => 'Ya existe un pago registrado para esta certificación.',
            ])->withInput();
        }

        try {
            DB::transaction(function () use ($request, $paymentMethodName) {
                
                // 3. Obtener modelos necesarios.
                $certification = Certification::findOrFail($request->certification_id);
                $paymentMethod = PaymentMethod::find($request->method_id);
                $paymentDetail = null;

                // 4. Procesar la subida del archivo.
                $receiptPath = null;
                if ($request->hasFile('receipt')) {
                    $basePath = "certifications/{$certification->identificationNumber}";
                    $receiptPath = $request->file('receipt')->store($basePath, 'public');
                }

                // 5. Crear el registro de detalle del pago específico.
                switch ($paymentMethod->name) {
                    case 'cash':
                        $paymentDetail = CashPaymentDetail::create([
                            'received_amount' => $request->amount,
                            'change_given'    => 0,
                        ]);
                        break;
                    
                    case 'deposit':
                    case 'transfer':
                        $request->validate([
                            'reference_number'         => 'required|string|unique:bank_payment_details,reference_number',
                            'transaction_date'         => 'required|date',
                            'destination_bank_account' => 'required|string',
                        ]);
                        $paymentDetail = BankPaymentDetail::create([
                            'type'                     => $paymentMethod->name, 
                            'destination_bank_account' => $request->destination_bank_account,
                            'reference_number'         => $request->reference_number,
                            'transaction_date'         => $request->transaction_date,
                            'origin_bank'              => $request->origin_bank,
                            'receipt'                  => $receiptPath,
                        ]);
                        break;

                    case 'credit_card':
                    case 'debit_card':
                        $request->validate([
                            'last_four_digits'   => 'required|digits:4',
                            'card_brand'         => 'required|string',
                            'authorization_code' => 'nullable|string',
                        ]);
                        $cardData = $request->only(['transaction_code', 'authorization_code', 'card_brand', 'last_four_digits', 'installments']);
                        $cardData['receipt'] = $receiptPath;
                        $paymentDetail = CardPaymentDetail::create($cardData);
                        break;
                    
                    default:
                        throw new \Exception("Método de pago no soportado.");
                }

                // 6. Crear el pago principal y asociarlo con su detalle.
                $status = in_array($paymentMethod->name, ['transfer', 'deposit'])
                    ? Payment::STATUS_PENDING
                    : Payment::STATUS_VERIFIED;

                $paymentDetail->payment()->create([
                    'certification_id' => $request->certification_id,
                    'amount'           => $request->amount,
                    'payment_date'     => now(),
                    'status'           => $status,
                    'notes'            => $request->notes,
                ]);
            });

        } catch (\Throwable $th) {
            // Manejo de errores que devuelve un error de validación a Inertia.
            Log::channel('debugging')->error('Error al registrar el pago: ' . $th->getMessage(), [
                'request' => $request->all(),
                'file'    => $th->getFile(),
                'line'    => $th->getLine(),
            ]);
            throw ValidationException::withMessages([
                '_error' => 'No se pudo procesar el pago: ' . $th->getMessage(),
            ]);
        }

        // 7. Respuesta de éxito para Inertia.
        return redirect()->back()->with('success', 'Pago registrado exitosamente.');
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
        $request->validate(['notes' => 'nullable|string']);
        $payment->update($request->only('notes'));

        return response()->json($payment->fresh()->load('detailable'));
    }

    public function destroy($certification_id)
    {
        $payment = Payment::where('certification_id', $certification_id)->first();

        if (!$payment) {
            return redirect()->back()->with('error', 'Pago no encontrado para la certificación proporcionada.');
        }

        try {
            DB::transaction(function () use ($payment) {
                if ($payment->detailable) {
                    if ($payment->detailable->receipt) {
                        Storage::disk('public')->delete($payment->detailable->receipt);
                    }
                    $payment->detailable->delete();
                }
                $payment->delete();
            });

        } catch (\Exception $e) {
            throw ValidationException::withMessages([
            '_error' => 'No se pudo eliminar el pago: ' . $e->getMessage()
            ]);
        }
        return redirect()->back()->with('success', 'Pago y comprobante eliminados correctamente.');
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

        $payment->status = $request->status;
        if ($request->has('notes')) {
            $payment->notes = ($payment->notes ? $payment->notes . "\n" : '') . "Nota de estado: " . $request->notes;
        }
        $payment->save();

        return response()->json($payment->fresh()->load('detailable'));
    }
}