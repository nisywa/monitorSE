<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use App\Models\Laporan;
use App\Models\Survei;
use App\Models\Pcl;
use App\Models\Pml;
use App\Models\Kecamatan;
use App\Models\Desa;
use App\Models\Sls;

class LaporanController extends Controller
{
    use AuthorizesRequests;
    /**
     * Tampilkan list laporan sesuai role
     * - Admin : semua laporan
     * - PML   : laporan milik PML-nya saja
     * - PCL   : laporan milik PCL-nya saja
     */
    public function index(Request $request)
    {
        $selectedSurvei = $request->query('survei_id');
        $selectedTab = $request->query('tab');
        $selectedDate = $request->query('tanggal');
        $user  = Auth::user();
        $pclAssignmentContext = $user->role === 'PCL'
            ? $this->getPclAssignmentContext($user)
            : null;
        $query = Laporan::with(['survei', 'pcl', 'pml', 'kecamatan', 'desa', 'sls']);

        if ($user->role === 'PML') {
            $pml = $user->pml;
            if ($pml && $pml->id) {
                $query->where('pml_id', $pml->id);
            }
        } elseif ($user->role === 'PCL') {
            $pclIds = $pclAssignmentContext['pcl_ids'] ?? [];
            if (!empty($pclIds)) {
                $query->whereIn('pcl_id', $pclIds);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $laporans = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($laporan) {
                return [
                    'id'             => (int) $laporan->id,
                    'nama_survei'    => $laporan->survei->nama_survei ?? '-',
                    'survei_id'      => (int) $laporan->survei_id,
                    'nama_pcl'       => $laporan->pcl->nama_pcl ?? '-',
                    'pcl_id'         => (int) $laporan->pcl_id,
                    'nama_pml'       => $laporan->pml->nama_pml ?? '-',
                    'pml_id'         => (int) $laporan->pml_id,
                    'tanggal'        => $laporan->tanggal,
                    'data_cacah'     => (int) ($laporan->data_cacah ?? 0),
                    'data_usaha'     => (int) ($laporan->data_usaha ?? 0),
                    'data_keluarga'  => (int) ($laporan->data_keluarga ?? 0),
                    'data_submit'    => (int) ($laporan->data_submit ?? 0),
                    'menemukan_usaha_digital' => (bool) ($laporan->menemukan_usaha_digital ?? false),
                    'jumlah_usaha_digital'    => (int) ($laporan->jumlah_usaha_digital ?? 0),
                    'keterangan'      => $laporan->keterangan,
                    'kecamatan_id'   => (int) ($laporan->kecamatan_id ?? 0),
                    'desa_id'        => (int) ($laporan->desa_id ?? 0),
                    'sls_id'         => (int) ($laporan->sls_id ?? 0),
                    'nama_kecamatan' => $laporan->kecamatan->nama ?? '-',
                    'nama_desa'      => $laporan->desa->nama ?? '-',
                    'nomor_sls'      => $laporan->sls->nomor_sls ?? '-',
                    'survei_status'  => $this->getStatus($laporan->survei->tanggal_mulai, $laporan->survei->tanggal_selesai),
                ];
            });

        // Data untuk dropdown form tambah laporan (PCL) dan filter PCL bagi PML
        $surveis = [];
        $pmlBySurvei = [];
        $pclsBySurvei = [];
        $wilayahBySurvei = [];

        if ($user->role === 'PCL') {
            $surveis = collect($pclAssignmentContext['surveis'] ?? []);
            $pmlBySurvei = $pclAssignmentContext['pml_by_survei'] ?? [];
            $wilayahBySurvei = $pclAssignmentContext['wilayah_by_survei'] ?? [];
        } elseif ($user->role === 'PML') {
            $pml = $user->pml;

            if ($pml) {
                $directSurveis = $pml->surveis()
                    ->select('survei.id', 'survei.nama_survei')
                    ->get();

                $pclSurveis = Survei::select('survei.id', 'survei.nama_survei')
                    ->whereHas('pcls', function ($query) use ($pml) {
                        $query->whereHas('pmls', function ($query) use ($pml) {
                            $query->where('pml.id', $pml->id);
                        });
                    })
                    ->get();

                $surveis = $directSurveis->merge($pclSurveis)
                    ->unique('id')
                    ->values();

                $pclsBySurvei = $pml->pcls()
                    ->whereHas('surveis', function ($query) use ($surveis) {
                        $query->whereIn('survei.id', $surveis->pluck('id'));
                    })
                    ->with('surveis:id')
                    ->get()
                    ->flatMap(function ($pcl) {
                        return $pcl->surveis->map(fn ($survei) => [
                            'survei_id' => $survei->id,
                            'pcl_id'    => $pcl->id,
                            'nama_pcl'  => $pcl->nama_pcl,
                        ]);
                    })
                    ->groupBy('survei_id')
                    ->map(function ($items) {
                        return $items->unique('pcl_id')->map(fn ($item) => [
                            'id'       => $item['pcl_id'],
                            'nama_pcl' => $item['nama_pcl'],
                        ])->values();
                    })
                    ->toArray();
            } else {
                $surveis = collect();
            }
        } elseif ($user->role === 'admin') {
            $surveis = Survei::select('id', 'nama_survei')->get();
        }

        if (!$selectedSurvei && in_array($user->role, ['PCL', 'PML']) && collect($surveis)->isNotEmpty()) {
            $firstSurvei = collect($surveis)->first();
            $selectedSurvei = is_array($firstSurvei) ? $firstSurvei['id'] : $firstSurvei->id;
        }

        // Data PCL yang belum submit laporan hari ini (untuk PML)
        $pclsBelumKirim = [];
        if ($user->role === 'PML') {
            $pml = $user->pml;
            // Gunakan timezone Asia/Jakarta (WIB)
            $today = now('Asia/Jakarta')->toDateString();
            $reportDate = $selectedDate ?: $today;

            if ($pml) {
                // Hanya hitung "belum kirim" ketika PML memilih satu survei tertentu
                if ($selectedSurvei) {
                    // Pastikan survei tersebut memang menjadi tanggung jawab PML
                    $isResponsible = $pml->surveis()->where('survei.id', $selectedSurvei)->exists();

                    if ($isResponsible) {
                        $pmlSurveiIds = [$selectedSurvei];

                        // Ambil hanya PCL yang berada di bawah tanggung jawab PML login
                        // pada survei terpilih, lalu cek laporan untuk PML dan tanggal tersebut.
                        $pclsBelum = $pml->pcls()
                            ->whereHas('surveis', function ($query) use ($pmlSurveiIds) {
                                $query->whereIn('survei.id', $pmlSurveiIds);
                            })
                            ->whereDoesntHave('laporan', function ($query) use ($pml, $pmlSurveiIds, $reportDate) {
                                $query->whereIn('survei_id', $pmlSurveiIds)
                                    ->where('pml_id', $pml->id)
                                    ->whereDate('tanggal', $reportDate);
                            })
                            ->get();

                        $pclsBelumKirim = $pclsBelum->map(function ($pcl) {
                            return [
                                'pcl_id'         => $pcl->id,
                                'nama_pcl'       => $pcl->nama_pcl,
                                'asal_kecamatan' => $pcl->asal_kecamatan,
                                'desa'           => $pcl->desa,
                                'sls'            => $pcl->sls,
                                'no_telp'        => $pcl->no_telp,
                            ];
                        })
                            ->unique(fn ($pcl) => strtolower(trim((string) $pcl['nama_pcl'])))
                            ->values()
                            ->toArray();
                    }
                }
            }
        }

        return Inertia::render('Laporan/Index', [
            'laporans'        => $laporans,
            'surveis'         => $surveis,
            'pmlBySurvei'     => $pmlBySurvei,
            'pclsBySurvei'    => $pclsBySurvei,
            'wilayahBySurvei'  => $wilayahBySurvei,
            'pclsBelumKirim'  => $pclsBelumKirim,
            'selectedSurvei'  => $selectedSurvei ? (int) $selectedSurvei : null,
            'selectedDate'    => $selectedDate ?? null,
            'initialTab'      => $selectedTab ?? null,
            'role'            => $user->role,
        ]);
    }

    /**
     * Tampilkan Data per Level untuk admin.
     */
    public function dataPerLevel(Request $request)
    {
        $selectedSurvei = $request->query('survei_id');
        $selectedKecamatan = $request->query('kecamatan_id');
        $selectedPml = $request->query('pml_id');
        $selectedDesa = $request->query('desa_id');
        $selectedSls = $request->query('sls_id');
        $selectedTanggal = $request->query('tanggal');

        if (!$selectedSurvei) {
            $selectedKecamatan = null;
            $selectedPml = null;
            $selectedDesa = null;
            $selectedSls = null;
        } elseif (!$selectedKecamatan) {
            $selectedPml = null;
            $selectedDesa = null;
            $selectedSls = null;
        } elseif (!$selectedPml) {
            $selectedDesa = null;
            $selectedSls = null;
        } elseif (!$selectedDesa) {
            $selectedSls = null;
        }

        $surveis = Survei::select('id', 'nama_survei')->get();
        $filterOptions = [
            'kecamatan' => collect(),
            'pml' => collect(),
            'desa' => collect(),
            'sls' => collect(),
        ];

        $laporans = [];
        if ($selectedSurvei) {
            $baseFilterQuery = Laporan::query()
                ->where('survei_id', $selectedSurvei);

            $filterOptions['kecamatan'] = Kecamatan::where('kabupaten', 'Pinrang')
                ->where('provinsi', 'Sulawesi Selatan')
                ->orderBy('nama')
                ->get(['id', 'nama']);

            if ($selectedKecamatan) {
                $selectedKecamatanName = Kecamatan::where('id', $selectedKecamatan)->value('nama');

                $filterOptions['pml'] = Pml::select('pml.id', 'pml.nama_pml')
                    ->whereHas('surveis', function ($query) use ($selectedSurvei) {
                        $query->where('survei.id', $selectedSurvei);
                    })
                    ->whereHas('pcls', function ($query) use ($selectedSurvei, $selectedKecamatanName) {
                        $query->whereHas('surveis', function ($query) use ($selectedSurvei) {
                            $query->where('survei.id', $selectedSurvei);
                        });

                        if ($selectedKecamatanName) {
                            $query->whereRaw('LOWER(TRIM(asal_kecamatan)) = ?', [
                                $this->normalizeAssignmentValue($selectedKecamatanName),
                            ]);
                        }
                    })
                    ->orderBy('pml.nama_pml')
                    ->distinct()
                    ->get()
                    ->map(fn ($pml) => [
                        'id' => $pml->id,
                        'nama_pml' => $pml->nama_pml,
                    ]);
            }

            if ($selectedKecamatan && $selectedPml) {
                $selectedKecamatanName = Kecamatan::where('id', $selectedKecamatan)->value('nama');
                $assignedDesaNames = Pcl::whereHas('surveis', function ($query) use ($selectedSurvei) {
                        $query->where('survei.id', $selectedSurvei);
                    })
                    ->whereHas('pmls', function ($query) use ($selectedPml) {
                        $query->where('pml.id', $selectedPml);
                    })
                    ->when($selectedKecamatanName, function ($query) use ($selectedKecamatanName) {
                        $query->whereRaw('LOWER(TRIM(asal_kecamatan)) = ?', [
                            $this->normalizeAssignmentValue($selectedKecamatanName),
                        ]);
                    })
                    ->pluck('desa')
                    ->map(fn ($desa) => $this->normalizeAssignmentValue($desa))
                    ->filter()
                    ->unique()
                    ->values();

                $filterOptions['desa'] = Desa::where('kecamatan_id', $selectedKecamatan)
                    ->when($assignedDesaNames->isNotEmpty(), function ($query) use ($assignedDesaNames) {
                        $query->whereIn(DB::raw('LOWER(TRIM(nama))'), $assignedDesaNames->all());
                    })
                    ->orderBy('nama')
                    ->get(['id', 'nama'])
                    ->map(fn ($desa) => [
                        'id' => $desa->id,
                        'nama' => $desa->nama,
                    ]);
            }

            if ($selectedKecamatan && $selectedPml && $selectedDesa) {
                $filterOptions['sls'] = Sls::where('desa_id', $selectedDesa)
                    ->orderBy('nomor_sls')
                    ->get(['id', 'nomor_sls'])
                    ->map(fn ($sls) => [
                        'id' => $sls->id,
                        'nomor_sls' => $sls->nomor_sls,
                    ]);
            }

            if ($filterOptions['pml']->isEmpty() && $selectedKecamatan) {
                $filterOptions['pml'] = (clone $baseFilterQuery)
                    ->where('kecamatan_id', $selectedKecamatan)
                    ->with('pml:id,nama_pml')
                    ->whereNotNull('pml_id')
                    ->get()
                    ->map(fn ($laporan) => $laporan->pml)
                    ->filter()
                    ->unique('id')
                    ->sortBy('nama_pml')
                    ->values()
                    ->map(fn ($pml) => [
                        'id' => $pml->id,
                        'nama_pml' => $pml->nama_pml,
                    ]);
            }

            if ($filterOptions['desa']->isEmpty() && $selectedKecamatan && $selectedPml) {
                $filterOptions['desa'] = (clone $baseFilterQuery)
                    ->where('kecamatan_id', $selectedKecamatan)
                    ->where('pml_id', $selectedPml)
                    ->with('desa:id,nama')
                    ->whereNotNull('desa_id')
                    ->get()
                    ->map(fn ($laporan) => $laporan->desa)
                    ->filter()
                    ->unique('id')
                    ->sortBy('nama')
                    ->values()
                    ->map(fn ($desa) => [
                        'id' => $desa->id,
                        'nama' => $desa->nama,
                    ]);
            }

            if ($filterOptions['sls']->isEmpty() && $selectedKecamatan && $selectedPml && $selectedDesa) {
                $filterOptions['sls'] = (clone $baseFilterQuery)
                    ->where('kecamatan_id', $selectedKecamatan)
                    ->where('pml_id', $selectedPml)
                    ->where('desa_id', $selectedDesa)
                    ->with('sls:id,nomor_sls')
                    ->whereNotNull('sls_id')
                    ->get()
                    ->map(fn ($laporan) => $laporan->sls)
                    ->filter()
                    ->unique('id')
                    ->sortBy('nomor_sls')
                    ->values()
                    ->map(fn ($sls) => [
                        'id' => $sls->id,
                        'nomor_sls' => $sls->nomor_sls,
                    ]);
            }

            if ($filterOptions['desa']->isEmpty() && $selectedKecamatan && $selectedPml) {
                $filterOptions['desa'] = Desa::where('kecamatan_id', $selectedKecamatan)
                    ->orderBy('nama')
                    ->get(['id', 'nama'])
                    ->map(fn ($desa) => [
                        'id' => $desa->id,
                        'nama' => $desa->nama,
                    ]);
            }

            if ($filterOptions['sls']->isEmpty() && $selectedKecamatan && $selectedPml && $selectedDesa) {
                $filterOptions['sls'] = Sls::where('desa_id', $selectedDesa)
                    ->orderBy('nomor_sls')
                    ->get(['id', 'nomor_sls'])
                    ->map(fn ($sls) => [
                        'id' => $sls->id,
                        'nomor_sls' => $sls->nomor_sls,
                    ]);
            }

            $query = Laporan::with(['survei', 'pcl', 'pml', 'kecamatan', 'desa', 'sls'])
                ->where('survei_id', $selectedSurvei);

            if ($selectedKecamatan) {
                $query->where('kecamatan_id', $selectedKecamatan);
            }
            if ($selectedPml) {
                $query->where('pml_id', $selectedPml);
            }
            if ($selectedDesa) {
                $query->where('desa_id', $selectedDesa);
            }
            if ($selectedSls) {
                $query->where('sls_id', $selectedSls);
            }
            if ($selectedTanggal) {
                $query->whereDate('tanggal', $selectedTanggal);
            }

            $laporans = $query->orderBy('tanggal', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($laporan) {
                    return [
                        'id'             => $laporan->id,
                        'nama_pcl'       => $laporan->pcl->nama_pcl ?? '-',
                        'nama_pml'       => $laporan->pml->nama_pml ?? '-',
                        'tanggal'        => $laporan->tanggal,
                        'data_cacah'     => $laporan->data_cacah,
                        'nama_kecamatan' => $laporan->kecamatan->nama ?? '-',
                        'nama_desa'      => $laporan->desa->nama ?? '-',
                        'nomor_sls'      => $laporan->sls->nomor_sls ?? '-',
                        'data_usaha'     => $laporan->data_usaha,
                        'data_keluarga'  => $laporan->data_keluarga,
                        'data_submit'    => $laporan->data_submit,
                        'menemukan_usaha_digital' => (bool) ($laporan->menemukan_usaha_digital ?? false),
                        'jumlah_usaha_digital'    => (int) ($laporan->jumlah_usaha_digital ?? 0),
                        'keterangan'      => $laporan->keterangan,
                    ];
                });
        }

        return Inertia::render('DataPerLevel', [
            'surveis' => $surveis,
            'laporans' => $laporans,
            'filterOptions' => $filterOptions,
            'selectedSurvei' => $selectedSurvei,
            'selectedKecamatan' => $selectedKecamatan,
            'selectedPml' => $selectedPml,
            'selectedDesa' => $selectedDesa,
            'selectedSls' => $selectedSls,
            'selectedTanggal' => $selectedTanggal,
        ]);
    }

    /**
     * Simpan laporan baru — hanya PCL
     */
    public function store(Request $request)
    {
        $this->authorize('create', Laporan::class);

        $user = Auth::user();
        $assignmentContext = $this->getPclAssignmentContext($user);

        $request->validate([
            'survei_id'    => 'required|exists:survei,id',
            'pml_id'       => 'required|exists:pml,id',
            'kecamatan_id' => 'required|exists:kecamatan,id',
            'desa_id'      => 'required|exists:desa,id',
            'sls_id'       => 'required|exists:sls,id',
            'data_cacah'   => 'required|integer|min:0',
            'tanggal'      => 'required|date',
            'data_usaha'   => 'required|integer|min:0',
            'data_keluarga'=> 'required|integer|min:0',
            'data_submit'  => 'required|integer|min:0',
            'menemukan_usaha_digital' => 'required|boolean',
            'jumlah_usaha_digital'    => 'nullable|required_if:menemukan_usaha_digital,1|integer|min:0',
            'keterangan'   => 'nullable|string|max:1000',
        ], [
            'data_cacah.required'   => 'Data cacah wajib diisi.',
            'data_cacah.integer'    => 'Data cacah harus berupa angka.',
            'survei_id.required'     => 'Survei wajib dipilih.',
            'survei_id.exists'       => 'Survei tidak ditemukan.',
            'pml_id.required'        => 'PML wajib diisi. Pilih survei terlebih dahulu.',
            'pml_id.exists'          => 'PML tidak ditemukan.',
            'tanggal.required'       => 'Tanggal wajib diisi.',
            'data_usaha.required'    => 'Data usaha wajib diisi.',
            'data_usaha.integer'     => 'Data usaha harus berupa angka.',
            'data_keluarga.required' => 'Data keluarga wajib diisi.',
            'data_keluarga.integer'  => 'Data keluarga harus berupa angka.',
            'sls_id.required'         => 'SLS wajib dipilih.',
            'sls_id.exists'           => 'SLS tidak ditemukan.',
            'data_submit.required'   => 'Data submit wajib diisi.',
            'data_submit.integer'    => 'Data submit harus berupa angka.',
            'menemukan_usaha_digital.required' => 'Pilihan temuan usaha digital/online wajib diisi.',
            'menemukan_usaha_digital.boolean'  => 'Pilihan temuan usaha digital/online tidak valid.',
            'jumlah_usaha_digital.required_if' => 'Jumlah usaha digital/online wajib diisi jika memilih Ya.',
            'jumlah_usaha_digital.integer'     => 'Jumlah usaha digital/online harus berupa angka.',
        ]);

        $kecamatan = Kecamatan::findOrFail($request->kecamatan_id);
        $desa = Desa::findOrFail($request->desa_id);
        $sls = Sls::findOrFail($request->sls_id);

        if (!Desa::where('id', $request->desa_id)->where('kecamatan_id', $request->kecamatan_id)->exists()) {
            return redirect()->back()->withErrors(['desa_id' => 'Desa tidak valid untuk kecamatan yang dipilih.']);
        }

        if (!Sls::where('id', $request->sls_id)->where('desa_id', $request->desa_id)->exists()) {
            return redirect()->back()->withErrors(['sls_id' => 'SLS tidak valid untuk desa yang dipilih.']);
        }

        $assignment = collect($assignmentContext['assignments'] ?? [])->first(function ($assignment) use ($request) {
            return (int) $assignment['survei_id'] === (int) $request->survei_id
                && (int) $assignment['pml_id'] === (int) $request->pml_id
                && (int) $assignment['kecamatan_id'] === (int) $request->kecamatan_id
                && (int) $assignment['desa_id'] === (int) $request->desa_id
                && (int) $assignment['sls_id'] === (int) $request->sls_id;
        });

        if (!$assignment) {
            return redirect()->back()->withErrors([
                'sls_id' => 'Survei, PML, atau wilayah yang dipilih tidak sesuai dengan penugasan PCL.',
            ])->withInput();
        }

        Laporan::create([
            'survei_id'      => $assignment['survei_id'],
            'pcl_id'         => $assignment['pcl_id'],
            'pml_id'         => $assignment['pml_id'],
            'kecamatan_id'   => $assignment['kecamatan_id'],
            'desa_id'        => $assignment['desa_id'],
            'sls_id'         => $assignment['sls_id'],
            'nama_kecamatan' => $kecamatan->nama,
            'nama_desa'      => $desa->nama,
            'nomor_sls'      => $sls->nomor_sls,
            'tanggal'        => $request->tanggal,
            'data_cacah'     => $request->data_cacah,
            'data_usaha'     => $request->data_usaha,
            'data_keluarga'  => $request->data_keluarga,
            'data_submit'    => $request->data_submit,
            'menemukan_usaha_digital' => $request->boolean('menemukan_usaha_digital'),
            'jumlah_usaha_digital'    => $request->boolean('menemukan_usaha_digital') ? (int) $request->jumlah_usaha_digital : 0,
            'keterangan'      => $request->keterangan,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil ditambahkan.');
    }

    /**
     * Tampilkan detail laporan tertentu
     */
    public function show($id)
    {
        $laporan = Laporan::with(['survei', 'pcl', 'pml'])->findOrFail($id);

        return response()->json([
            'id'             => $laporan->id,
            'survei_id'      => $laporan->survei_id,
            'nama_survei'    => $laporan->survei->nama_survei ?? '-',
            'pcl_id'         => $laporan->pcl_id,
            'nama_pcl'       => $laporan->pcl->nama_pcl ?? '-',
            'pml_id'         => $laporan->pml_id,
            'nama_pml'       => $laporan->pml->nama_PML ?? '-',
            'kecamatan_id'   => $laporan->kecamatan_id,
            'desa_id'        => $laporan->desa_id,
            'sls_id'         => $laporan->sls_id,
            'nama_kecamatan' => $laporan->kecamatan->nama ?? '-',
            'nama_desa'      => $laporan->desa->nama ?? '-',
                    'nomor_sls'      => $laporan->sls->nomor_sls ?? '-',
                    'tanggal'        => $laporan->tanggal,
                    'data_cacah'     => $laporan->data_cacah,
                    'data_usaha'     => $laporan->data_usaha,
                    'data_keluarga'  => $laporan->data_keluarga,
                    'data_submit'    => $laporan->data_submit,
                    'menemukan_usaha_digital' => (bool) ($laporan->menemukan_usaha_digital ?? false),
                    'jumlah_usaha_digital'    => (int) ($laporan->jumlah_usaha_digital ?? 0),
                    'keterangan'      => $laporan->keterangan,
        ]);
    }

    /**
     * Update laporan — hanya PML
     */
    public function update(Request $request, $id)
    {
        $laporan = Laporan::findOrFail($id);

        $this->authorize('update', $laporan);

        $request->validate([
            'kecamatan_id' => 'required|exists:kecamatan,id',
            'desa_id'      => 'required|exists:desa,id',
            'sls_id'       => 'required|exists:sls,id',
            'data_cacah'   => 'nullable|integer|min:0',
            'tanggal'      => 'required|date',
            'data_usaha'   => 'required|integer|min:0',
            'data_keluarga'=> 'required|integer|min:0',
            'data_submit'  => 'nullable|integer|min:0',
            'menemukan_usaha_digital' => 'required|boolean',
            'jumlah_usaha_digital'    => 'nullable|required_if:menemukan_usaha_digital,1|integer|min:0',
            'keterangan'   => 'nullable|string|max:1000',
        ], [
            'tanggal.required'       => 'Tanggal wajib diisi.',
            'data_usaha.required'    => 'Data usaha wajib diisi.',
            'data_usaha.integer'     => 'Data usaha harus berupa angka.',
            'data_keluarga.required' => 'Data keluarga wajib diisi.',
            'data_keluarga.integer'  => 'Data keluarga harus berupa angka.',
            'menemukan_usaha_digital.required' => 'Pilihan temuan usaha digital/online wajib diisi.',
            'menemukan_usaha_digital.boolean'  => 'Pilihan temuan usaha digital/online tidak valid.',
            'jumlah_usaha_digital.required_if' => 'Jumlah usaha digital/online wajib diisi jika memilih Ya.',
            'jumlah_usaha_digital.integer'     => 'Jumlah usaha digital/online harus berupa angka.',
        ]);

        if (!Desa::where('id', $request->desa_id)->where('kecamatan_id', $request->kecamatan_id)->exists()) {
            return redirect()->back()->withErrors(['desa_id' => 'Desa tidak valid untuk kecamatan yang dipilih.']);
        }

        $kecamatan = Kecamatan::findOrFail($request->kecamatan_id);
        $desa = Desa::findOrFail($request->desa_id);
        $sls = Sls::findOrFail($request->sls_id);

        if (!Sls::where('id', $request->sls_id)->where('desa_id', $request->desa_id)->exists()) {
            return redirect()->back()->withErrors(['sls_id' => 'SLS tidak valid untuk desa yang dipilih.']);
        }

        $laporan->update([
            'data_cacah'     => $request->data_cacah ?? $laporan->data_cacah,
            'kecamatan_id'   => $request->kecamatan_id,
            'desa_id'        => $request->desa_id,
            'sls_id'         => $request->sls_id,
            'nama_kecamatan' => $kecamatan->nama,
            'nama_desa'      => $desa->nama,
            'nomor_sls'      => $sls->nomor_sls,
            'tanggal'        => $request->tanggal,
            'data_usaha'     => $request->data_usaha,
            'data_keluarga'  => $request->data_keluarga,
            'data_submit'    => $request->data_submit ?? $laporan->data_submit,
            'menemukan_usaha_digital' => $request->boolean('menemukan_usaha_digital'),
            'jumlah_usaha_digital'    => $request->boolean('menemukan_usaha_digital') ? (int) $request->jumlah_usaha_digital : 0,
            'keterangan'      => $request->keterangan,
        ]);

        return redirect()->back()->with('success', 'Laporan berhasil diperbarui.');
    }

    public function destroy($id)
    {
        $laporan = Laporan::findOrFail($id);

        $this->authorize('delete', $laporan);

        $laporan->delete();

        return redirect()->back()->with('success', 'Laporan berhasil dihapus.');
    }

    private function getPclAssignmentContext($user): array
    {
        $context = [
            'pcl_ids' => [],
            'surveis' => [],
            'pml_by_survei' => [],
            'wilayah_by_survei' => [],
            'assignments' => [],
        ];

        if (!$user) {
            return $context;
        }

        $pclRows = Pcl::with(['surveis:id,nama_survei', 'pmls.surveis:id'])
            ->where('user_id', $user->id)
            ->get();

        $context['pcl_ids'] = $pclRows->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        if ($pclRows->isEmpty()) {
            return $context;
        }

        $kecamatanByName = Kecamatan::select('id', 'nama')
            ->get()
            ->keyBy(fn ($kecamatan) => $this->normalizeAssignmentValue($kecamatan->nama));

        $desaByKey = Desa::select('id', 'kecamatan_id', 'nama')
            ->get()
            ->keyBy(fn ($desa) => $desa->kecamatan_id . '|' . $this->normalizeAssignmentValue($desa->nama));

        $slsByKey = Sls::select('id', 'desa_id', 'nomor_sls')
            ->get()
            ->keyBy(fn ($sls) => $sls->desa_id . '|' . $this->normalizeAssignmentValue($sls->nomor_sls));

        $surveiMap = [];
        $wilayahBySurvei = [];
        $assignmentMap = [];

        foreach ($pclRows as $pcl) {
            $kecamatan = $kecamatanByName->get($this->normalizeAssignmentValue($pcl->asal_kecamatan));
            $desa = $kecamatan
                ? $desaByKey->get($kecamatan->id . '|' . $this->normalizeAssignmentValue($pcl->desa))
                : null;
            $sls = $desa
                ? $this->resolveAssignedSls($pcl, $desa, $slsByKey)
                : null;

            foreach ($pcl->surveis as $survei) {
                $surveiId = (int) $survei->id;
                $surveiMap[$surveiId] = [
                    'id' => $surveiId,
                    'nama_survei' => $survei->nama_survei,
                ];

                $validPmls = $pcl->pmls
                    ->filter(fn ($pml) => $pml->surveis->contains(fn ($pmlSurvei) => (int) $pmlSurvei->id === $surveiId))
                    ->sortBy('id')
                    ->values();
                $pml = $validPmls->first();

                if ($pml && !isset($context['pml_by_survei'][$surveiId])) {
                    $context['pml_by_survei'][$surveiId] = [
                        'id' => (int) $pml->id,
                        'nama_pml' => $pml->nama_pml,
                    ];
                }

                if (!$pml || (int) ($context['pml_by_survei'][$surveiId]['id'] ?? 0) !== (int) $pml->id) {
                    continue;
                }

                if (!$kecamatan || !$desa || !$sls) {
                    continue;
                }

                $wilayahBySurvei[$surveiId]['kecamatan'][$kecamatan->id] = [
                    'id' => (int) $kecamatan->id,
                    'nama' => $kecamatan->nama,
                ];
                $wilayahBySurvei[$surveiId]['desa'][$desa->id] = [
                    'id' => (int) $desa->id,
                    'kecamatan_id' => (int) $kecamatan->id,
                    'nama' => $desa->nama,
                ];
                $wilayahBySurvei[$surveiId]['sls'][$sls->id] = [
                    'id' => (int) $sls->id,
                    'desa_id' => (int) $desa->id,
                    'nomor_sls' => $sls->nomor_sls,
                ];

                $assignmentKey = implode('|', [
                    $surveiId,
                    $pml->id,
                    $kecamatan->id,
                    $desa->id,
                    $sls->id,
                ]);

                $assignmentMap[$assignmentKey] ??= [
                    'survei_id' => $surveiId,
                    'pcl_id' => (int) $pcl->id,
                    'pml_id' => (int) $pml->id,
                    'kecamatan_id' => (int) $kecamatan->id,
                    'desa_id' => (int) $desa->id,
                    'sls_id' => (int) $sls->id,
                ];
            }
        }

        $context['surveis'] = collect($surveiMap)
            ->sortBy('nama_survei')
            ->values()
            ->all();

        foreach ($wilayahBySurvei as $surveiId => $wilayah) {
            $context['wilayah_by_survei'][$surveiId] = [
                'kecamatan' => collect($wilayah['kecamatan'] ?? [])->sortBy('nama')->values()->all(),
                'desa' => collect($wilayah['desa'] ?? [])->sortBy('nama')->values()->all(),
                'sls' => collect($wilayah['sls'] ?? [])->sortBy('nomor_sls')->values()->all(),
            ];
        }

        $context['assignments'] = array_values($assignmentMap);

        return $context;
    }

    private function normalizeAssignmentValue($value): string
    {
        return strtolower(trim((string) $value));
    }

    private function resolveAssignedSls($pcl, $desa, $slsByKey)
    {
        if (!$desa) {
            return null;
        }

        if (trim((string) $pcl->sls) !== '') {
            $matchedSls = $slsByKey->get($desa->id . '|' . $this->normalizeAssignmentValue($pcl->sls));

            if ($matchedSls) {
                return $matchedSls;
            }
        }

        return Sls::where('id', $pcl->id)
            ->where('desa_id', $desa->id)
            ->first();
    }

    /**
     * Helper: Tentukan status survei berdasarkan tanggal.
     */
    private function getStatus(string $tanggalMulai, string $tanggalSelesai): string
    {
        $today = now()->toDateString();

        if ($today < $tanggalMulai) {
            return 'Belum Mulai';
        } elseif ($today > $tanggalSelesai) {
            return 'Selesai';
        }

        return 'Berlangsung';
    }
}
