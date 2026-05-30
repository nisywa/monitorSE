<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Pcl;
use App\Models\Survei;
use App\Models\Pml;
use App\Services\WhatsAppBlastService;
use Carbon\Carbon;

class PclController extends Controller
{
    /**
     * Tampilkan list semua PCL
     */
  public function index()
{
    $pcls = Pcl::with(['user', 'pmls', 'surveis'])
        ->orderBy('created_at', 'desc')
        ->get();

    // Flatten: 1 baris per kombinasi PCL + Survei
    $rows = [];
    foreach ($pcls as $pcl) {
        if ($pcl->surveis->isEmpty()) {
            // PCL tanpa survei tetap ditampilkan
            $rows[] = [
                'id'                     => $pcl->id . '_0',
                'pcl_id'                 => $pcl->id,
                'nama_PCL'               => $pcl->nama_pcl,
                'tanggal_lahir'          => $pcl->tanggal_lahir,
                'tanggal_lahir_formatted' => $pcl->tanggal_lahir ? Carbon::parse($pcl->tanggal_lahir)->format('d-m-Y') : '-',
                'asal_kecamatan'         => $pcl->asal_kecamatan,
                'desa'                   => $pcl->desa,
                'sls'                    => $pcl->sls,
                'sobat_id'               => $pcl->sobat_id,
                'no_telp'                => $pcl->no_telp,
                'email'                  => $pcl->user->email ?? '-',
                'survei_id'              => null,
                'nama_survei'            => '-',
                'pml_id'                 => null,
                'nama_pml'               => '-',
                'created_at'             => $pcl->created_at?->format('Y-m-d'),
            ];
        } else {
            foreach ($pcl->surveis as $survei) {
                // Cari PML yang terkait dengan survei ini
                $pml = $pcl->pmls->firstWhere('pivot.survei_id', $survei->id)
                    ?? $pcl->pmls->first(); // fallback jika pivot tidak ada survei_id

                $rows[] = [
                    'id'                     => $pcl->id . '_' . $survei->id,
                    'pcl_id'                 => $pcl->id,
                    'nama_PCL'               => $pcl->nama_pcl,
                    'tanggal_lahir'          => $pcl->tanggal_lahir,
                    'tanggal_lahir_formatted' => $pcl->tanggal_lahir ? Carbon::parse($pcl->tanggal_lahir)->format('d-m-Y') : '-',
                    'asal_kecamatan'         => $pcl->asal_kecamatan,
                    'desa'                   => $pcl->desa,
                    'sls'                    => $pcl->sls,
                    'sobat_id'               => $pcl->sobat_id,
                    'no_telp'                => $pcl->no_telp,
                    'email'                  => $pcl->user->email ?? '-',
                    'survei_id'              => $survei->id,
                    'nama_survei'            => $survei->nama_survei,
                    'pml_id'                 => $pml?->id,
                    'nama_pml'               => $pml?->nama_pml ?? '-',
                    'created_at'             => $pcl->created_at?->format('Y-m-d'),
                ];
            }
        }
    }

    $pmls = Pml::with('surveis')->select('id', 'nama_pml')
        ->orderBy('nama_pml')
        ->get()
        ->map(fn($pml) => [
            'id'         => $pml->id,
            'nama_PML'   => $pml->nama_pml,
            'survei_ids' => $pml->surveis->pluck('id')->toArray(),
        ]);

    $today = Carbon::now('Asia/Jakarta')->toDateString();
    $surveis = Survei::select('id', 'nama_survei', 'tanggal_mulai', 'tanggal_selesai')
        ->orderBy('nama_survei')
        ->get()
        ->map(function ($s) use ($today) {
            $status = 'Berlangsung';
            if ($today < $s->tanggal_mulai) {
                $status = 'Belum Mulai';
            } elseif ($today > $s->tanggal_selesai) {
                $status = 'Selesai';
            }

            return [
                'id' => $s->id,
                'nama_survei' => $s->nama_survei,
                'status' => $status,
            ];
        });

    return Inertia::render('Admin/ManajemenPCL', [
        'pcls'    => $rows,
        'pmls'    => $pmls,
        'surveis' => $surveis,
    ]);
}

    /**
     * Simpan data PCL baru (sekaligus buat akun user)
     */
   public function store(Request $request)
{
    $request->validate([
        'nama'           => 'required|string|max:255',
        'email'          => 'required|email',
        'pml_id'         => 'required|exists:pml,id',
        'survei_id'      => 'required|exists:survei,id',
        'tanggal_lahir'  => 'required|date',
        'asal_kecamatan' => 'required|string|max:255',
        'desa'           => 'required|string|max:255',
        'sls'            => 'nullable|string|max:255',
        'sobat_id'       => 'nullable|string|max:255',
        'no_telp'        => 'nullable|string|max:20',
    ], [
        'nama.required'           => 'Nama PCL wajib diisi.',
        'email.required'          => 'Email wajib diisi.',
        'pml_id.required'         => 'PML wajib dipilih.',
        'survei_id.required'      => 'Survei wajib dipilih.',
        'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
        'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
        'desa.required'           => 'Desa wajib diisi.',
    ]);

    $generatedPassword = Carbon::parse($request->tanggal_lahir)->format('dmY');

    DB::transaction(function () use ($request, $generatedPassword) {
        // Cek apakah user dengan email ini sudah ada
        $user = User::where('email', $request->email)->first();

        if ($user) {
            // Pastikan role-nya PCL
            if ($user->role !== 'PCL') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'email' => 'Email ini sudah digunakan oleh akun dengan role lain.',
                ]);
            }

            // Jika user sudah ada, selalu buat PCL baru dengan data yang berbeda
            // (Multiple PCL dengan email sama tapi data berbeda di kecamatan, desa, sls, sobat_id, no_telp)
            $pcl = Pcl::create([
                'user_id'        => $user->id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'desa'           => $request->desa,
                'sls'            => $request->sls,
                'sobat_id'       => $request->sobat_id,
                'no_telp'        => $request->no_telp,
            ]);

            // Cek apakah kombinasi PCL-Survei-PML ini sudah ada
            $existingRelation = $pcl->surveis()
                ->where('survei_id', $request->survei_id)
                ->first();

            if ($existingRelation) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'survei_id' => 'PCL ini sudah terdaftar di survei yang dipilih.',
                ]);
            }

            // Tambahkan relasi survei & PML baru
            $pcl->surveis()->attach($request->survei_id);
            $pcl->pmls()->attach($request->pml_id);

        } else {
            // User belum ada, buat user baru
            $user = User::create([
                'nama'     => $request->nama,
                'email'    => $request->email,
                'password' => Hash::make($generatedPassword),
                'role'     => 'PCL',
            ]);

            $pcl = Pcl::create([
                'user_id'        => $user->id,
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'desa'           => $request->desa,
                'sls'            => $request->sls,
                'sobat_id'       => $request->sobat_id,
                'no_telp'        => $request->no_telp,
            ]);

            $pcl->pmls()->attach($request->pml_id);
            $pcl->surveis()->attach($request->survei_id);
        }
    });

    return redirect()->back()->with('success', "Data PCL berhasil ditambahkan. Password default: {$generatedPassword}");
}
    /**
     * Tampilkan data PCL tertentu (untuk form edit)
     */
    public function show($id)
    {
        $pcl = Pcl::with(['user', 'pmls', 'surveis'])->findOrFail($id);

        return response()->json([
            'id'             => $pcl->id,
            'nama_pcl'       => $pcl->nama_pcl,
            'tanggal_lahir'  => $pcl->tanggal_lahir,
            'asal_kecamatan' => $pcl->asal_kecamatan,
            'desa'           => $pcl->desa,
            'sls'            => $pcl->sls,
            'sobat_id'       => $pcl->sobat_id,
            'no_telp'        => $pcl->no_telp,
            'pml_id'         => $pcl->pmls->first()?->id,
            'survei_id'      => $pcl->surveis->first()?->id,
            'email'          => $pcl->user->email,
        ]);
    }

    /**
     * Update data PCL
     */
    public function update(Request $request, $id)
    {
        $pcl = Pcl::with('user')->findOrFail($id);

        $request->validate([
            'nama'           => 'required|string|max:255',
            'email'          => 'required|email|unique:users,email,' . $pcl->user->id,
            'pml_id'         => 'required|exists:pml,id',
            'survei_id'      => 'required|exists:survei,id',
            'tanggal_lahir'  => 'required|date',
            'asal_kecamatan' => 'required|string|max:255',
            'desa'           => 'required|string|max:255',
            'sls'            => 'nullable|string|max:255',
            'sobat_id'       => 'nullable|string|max:255',
            'no_telp'        => 'nullable|string|max:20',
            'password'       => 'nullable|min:6',
        ], [
            'nama.required'           => 'Nama PCL wajib diisi.',
            'email.required'          => 'Email wajib diisi.',
            'email.unique'            => 'Email sudah digunakan.',
            'pml_id.required'         => 'PML wajib dipilih.',
            'pml_id.exists'           => 'PML tidak ditemukan.',
            'survei_id.required'      => 'Survei wajib dipilih.',
            'survei_id.exists'        => 'Survei tidak ditemukan.',
            'tanggal_lahir.required'  => 'Tanggal lahir wajib diisi.',
            'asal_kecamatan.required' => 'Asal kecamatan wajib diisi.',
            'desa.required'           => 'Desa wajib diisi.',
            'password.min'            => 'Password minimal 6 karakter.',
        ]);

        DB::transaction(function () use ($request, $pcl) {
            // Update tabel users
            $userData = [
                'nama'  => $request->nama,
                'email' => $request->email,
            ];
            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }
            $pcl->user->update($userData);

            // Update tabel pcl
            $pcl->update([
                'nama_pcl'       => $request->nama,
                'tanggal_lahir'  => $request->tanggal_lahir,
                'asal_kecamatan' => $request->asal_kecamatan,
                'desa'           => $request->desa,
                'sls'            => $request->sls,
                'sobat_id'       => $request->sobat_id,
                'no_telp'        => $request->no_telp,
            ]);

            // Update relasi dengan PML (sync untuk replace)
            $pcl->pmls()->sync([$request->pml_id]);

            // Update relasi dengan Survei (sync untuk replace)
            $pcl->surveis()->sync([$request->survei_id]);
        });

        return redirect()->back()->with('success', 'Data PCL berhasil diperbarui.');
    }

    /**
     * Hapus data PCL (dan user terkait)
     */
    public function destroy($id)
    {
        $pcl = Pcl::with('user')->findOrFail($id);

        DB::transaction(function () use ($pcl) {
            $pcl->user->delete();
        });

        return redirect()->back()->with('success', 'Data PCL berhasil dihapus.');
    }

    /**
     * Get data PCL untuk export (JSON)
     */
    public function exportExcel($surveiId)
    {
        $pcls = Pcl::with(['user', 'surveis', 'pmls'])
            ->whereHas('surveis', function ($query) use ($surveiId) {
                $query->where('survei_id', $surveiId);
            })
            ->get();

        $survei = Survei::findOrFail($surveiId);
        
        $data = $pcls->map(function ($pcl) {
            return [
                'Nama PCL'     => $pcl->nama_pcl,
                'Email'        => $pcl->user->email ?? '',
                'Tanggal Lahir' => $pcl->tanggal_lahir,
                'Asal Kecamatan' => $pcl->asal_kecamatan,
                'Desa'         => $pcl->desa,
                'SLS'          => $pcl->sls ?? '',
                'Sobat ID'     => $pcl->sobat_id ?? '',
                'No Telepon'   => $pcl->no_telp ?? '',
                'PML'          => $pcl->pmls->first()?->nama_pml ?? '',
            ];
        })->toArray();

        return response()->json([
            'data' => $data,
            'survei_name' => $survei->nama_survei,
        ]);
    }

    /**
     * Kirim reminder WhatsApp ke semua PCL yang belum submit laporan hari ini
     */
    public function blastWhatsAppReminder(Request $request, WhatsAppBlastService $blastService)
    {
        if (!$blastService->isConfigured()) {
            $message = 'Fonnte belum dikonfigurasi. Silakan isi FONNTE_API_URL dan FONNTE_API_KEY di .env.';
            return $request->wantsJson()
                ? response()->json(['success' => false, 'message' => $message], 500)
                : redirect()->back()->with('error', $message);
        }

        // Use WIB (Asia/Jakarta) for "today" semantics
        $today = Carbon::now('Asia/Jakarta')->toDateString();
        $pcls = Pcl::whereNotNull('no_telp')
            ->whereHas('surveis', function ($query) use ($today) {
                $query->whereDate('tanggal_mulai', '<=', $today)
                      ->whereDate('tanggal_selesai', '>=', $today);
            })
            ->whereDoesntHave('laporan', function ($query) use ($today) {
                $query->where('tanggal', $today);
            })
            ->get();

        $results = $blastService->sendDailyReminderForPcls($pcls);
        $sentCount = collect($results)->where('success', true)->count();
        $failedCount = collect($results)->where('success', false)->count();
        $message = "Blast WhatsApp selesai. Terkirim: $sentCount. Gagal: $failedCount.";
        $isSuccess = $failedCount === 0;

        return $request->wantsJson()
            ? response()->json(['success' => $isSuccess, 'message' => $message, 'results' => $results])
            : redirect()->back()->with($isSuccess ? 'success' : 'error', $message);
    }

    /**
     * Debug / test route untuk mengirim satu pesan WA ke PCL pertama yang belum submit laporan hari ini.
     */
    public function testBlastWhatsApp(WhatsAppBlastService $blastService)
    {
        if (!$blastService->isConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Fonnte belum dikonfigurasi. Silakan isi FONNTE_API_URL dan FONNTE_API_KEY di .env.',
            ], 500);
        }

        $today = Carbon::now('Asia/Jakarta')->toDateString();
        $pcl = Pcl::whereNotNull('no_telp')
            ->whereHas('surveis', function ($query) use ($today) {
                $query->whereDate('tanggal_mulai', '<=', $today)
                      ->whereDate('tanggal_selesai', '>=', $today);
            })
            ->whereDoesntHave('laporan', function ($query) use ($today) {
                $query->where('tanggal', $today);
            })
            ->first();

        if (!$pcl) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada PCL yang belum submit laporan hari ini atau belum ada nomor WA yang valid.',
            ], 404);
        }

        $message = sprintf(
            'TEST Blast WA: Halo %s, ini pesan uji coba WA blast. Jika Anda menerima pesan ini, fitur WA blast sudah berjalan.',
            $pcl->nama_pcl
        );

        $result = $blastService->sendReminderToPhone($pcl->no_telp, $message);

        return response()->json(array_merge([
            'pcl_id'   => $pcl->id,
            'nama_pcl' => $pcl->nama_pcl,
            'phone'    => $pcl->no_telp,
        ], $result));
    }

    /**
     * Kirim pesan WA individual menggunakan header Authorization dan payload manual.
     */
    public function sendIndividualWhatsApp(Request $request)
    {
        $target = $request->query('target', '6283105002928');
        $message = $request->query('message', 'Halo');

        $response = Http::withHeaders([
            'Authorization' => env('FONNTE_API_KEY'),
        ])->post(env('FONNTE_API_URL'), [
            'target'  => $target,
            'message' => $message,
        ]);

        return response()->json([
            'target'   => $target,
            'message'  => $message,
            'status'   => $response->status(),
            'body'     => $response->json(),
            'success'  => $response->successful() && $response->json('status') === true,
        ]);
    }

    /**
     * Import data PCL dari Excel (dikirim sebagai JSON rows dari frontend)
     */
    public function importExcel(Request $request)
    {
        $request->validate([
            'rows'                      => 'required|array|min:1',
            'rows.*.nama_pcl'           => 'required|string|max:255',
            'rows.*.email'              => 'required|email|distinct',
            'rows.*.tanggal_lahir'      => 'required|date_format:Y-m-d',
            'rows.*.asal_kecamatan'     => 'required|string|max:255',
            'rows.*.desa'               => 'required|string|max:255',
            'rows.*.sls'                => 'nullable|string|max:255',
            'rows.*.sobat_id'           => 'nullable|string|max:255',
            'rows.*.no_telepon'         => 'nullable|string|max:255',
            'rows.*.pml'                => 'nullable|string|max:255',
            'survei_id'                 => 'required|exists:survei,id',
        ], [
            'rows.required'                    => 'Data import tidak boleh kosong.',
            'rows.*.nama_pcl.required'         => 'Nama PCL wajib diisi.',
            'rows.*.email.required'            => 'Email wajib diisi.',
            'rows.*.email.email'               => 'Format email tidak valid.',
            'rows.*.email.distinct'            => 'Terdapat email duplikat dalam file Excel.',
            'rows.*.tanggal_lahir.required'    => 'Tanggal lahir wajib diisi.',
            'rows.*.tanggal_lahir.date_format' => 'Format tanggal lahir harus YYYY-MM-DD.',
            'rows.*.asal_kecamatan.required'   => 'Asal kecamatan wajib diisi.',
            'rows.*.desa.required'             => 'Desa wajib diisi.',
            'survei_id.required'               => 'Survei ID wajib diisi.',
            'survei_id.exists'                 => 'Survei tidak ditemukan.',
        ]);

        $rows = $request->rows;
        $surveiId = $request->survei_id;
        $berhasil = 0;

        try {
            DB::transaction(function () use ($rows, $surveiId, &$berhasil) {
                foreach ($rows as $row) {
                    $email = strtolower(trim($row['email']));
                    
                    // Cari atau buat user
                    $user = User::where('email', $email)->first();
                    
                    if (!$user) {
                        $generatedPassword = Carbon::parse($row['tanggal_lahir'])->format('dmY');
                        $user = User::create([
                            'nama'     => $row['nama_pcl'],
                            'email'    => $email,
                            'password' => Hash::make($generatedPassword),
                            'role'     => 'PCL',
                        ]);
                    }

                    // Pastikan role PCL
                    if ($user->role !== 'PCL') {
                        throw new \Exception('User dengan email ' . $email . ' memiliki role yang berbeda.');
                    }

                    // Buat PCL baru (multiple PCL per user diizinkan)
                    $pcl = Pcl::create([
                        'user_id'        => $user->id,
                        'nama_pcl'       => $row['nama_pcl'],
                        'tanggal_lahir'  => $row['tanggal_lahir'],
                        'asal_kecamatan' => $row['asal_kecamatan'],
                        'desa'           => $row['desa'],
                        'sls'            => !empty($row['sls']) ? $row['sls'] : null,
                        'sobat_id'       => !empty($row['sobat_id']) ? $row['sobat_id'] : null,
                        'no_telp'        => !empty($row['no_telepon']) ? $row['no_telepon'] : null,
                    ]);

                    // Attach ke survei
                    $pcl->surveis()->attach($surveiId);

                    // Attach ke PML jika ada
                    if (!empty($row['pml'])) {
                        $pmlName = trim($row['pml']);
                        $pml = Pml::where('nama_pml', $pmlName)
                                  ->orWhere('nama_pml', 'like', '%' . $pmlName . '%')
                                  ->first();
                        if ($pml) {
                            $pcl->pmls()->attach($pml->id);
                        }
                    }

                    $berhasil++;
                }
            });

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Data PCL berhasil diimport. $berhasil baris berhasil ditambahkan.",
                    'imported' => $berhasil,
                ]);
            }

            return redirect()->back()->with('success', "Data PCL berhasil diimport. $berhasil baris berhasil ditambahkan.");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengimport file: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Gagal mengimport file: ' . $e->getMessage());
        }
    }
}
