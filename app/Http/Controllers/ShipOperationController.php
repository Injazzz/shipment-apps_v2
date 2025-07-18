<?php
// app/Http/Controllers/ShipOperationController.php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Ship;
use Inertia\Inertia;
use App\Models\Country;
use App\Models\CargoType;
use App\Models\ShippingLine;
use Illuminate\Http\Request;
use App\Models\ShipOperation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exports\ShipOperationExport;
use App\Http\Controllers\Controller;
use App\Imports\ShipOperationImport;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;

class ShipOperationController extends Controller
{
    public function index(Request $request)
    {
        $query = ShipOperation::with(['ship.country', 'ship.shippingLine', 'cargoType', 'user'])
            ->where('user_id', Auth::id());

        // Filter berdasarkan tanggal
        if ($request->filled('date_from')) {
            $query->where('operation_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('operation_date', '<=', $request->date_to);
        }

        // Filter berdasarkan cargo category
        if ($request->filled('cargo_category')) {
            $query->whereHas('cargoType', function ($q) use ($request) {
                $q->where('category', $request->cargo_category);
            });
        }

        // Filter berdasarkan shipping line
        if ($request->filled('shipping_line')) {
            $query->whereHas('ship.shippingLine', function ($q) use ($request) {
                $q->where('id', $request->shipping_line);
            });
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('ship', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                })->orWhereHas('cargoType', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
        }

        $operations = $query->latest('operation_date')->paginate(10);

        // Data untuk dropdown
        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();
        $cargoTypes = CargoType::orderBy('name')->get();

        return Inertia::render('user/ship-operations/index', [
            'operations' => $operations,
            'countries' => $countries,
            'shippingLines' => $shippingLines,
            'cargoTypes' => $cargoTypes,
            'filters' => $request->only(['date_from', 'date_to', 'cargo_category', 'shipping_line', 'search'])
        ]);
    }

    public function create()
    {
        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();
        $cargoTypes = CargoType::orderBy('name')->get();
        $ships = Ship::with(['country', 'shippingLine'])->orderBy('name')->get();

        return Inertia::render('user/ship-operations/create', [
            'countries' => $countries,
            'shippingLines' => $shippingLines,
            'cargoTypes' => $cargoTypes,
            'ships' => $ships,
        ]);
    }

    public function store(Request $request)
    {
        Log::info('Ship Operation Input:', $request->all());

        $validated = $request->validate([
            'ship_id' => 'required|exists:ships,id',
            'cargo_type_id' => 'required|exists:cargo_types,id',
            'operation_date' => 'required|date',
            'unloading_tonnage' => 'required|numeric|min:0',
            'loading_tonnage' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:1000',
        ]);

        $validated['user_id'] = Auth::id();

        Log::info('Validated data:', $validated);

        ShipOperation::create($validated);

        return redirect()->route('user.ship-operations.index')
            ->with('success', 'Data operasi kapal berhasil ditambahkan.');
    }

    public function show(ShipOperation $shipOperation)
    {
        $this->authorize('view', $shipOperation);

        $shipOperation->load(['ship.country', 'ship.shippingLine', 'cargoType', 'user']);

        return Inertia::render('user/ship-operations/show', [
            'operation' => $shipOperation
        ]);
    }

    public function edit(ShipOperation $shipOperation)
    {
        $this->authorize('update', $shipOperation);

        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();
        $cargoTypes = CargoType::orderBy('name')->get();
        $ships = Ship::with(['country', 'shippingLine'])->orderBy('name')->get();

        return Inertia::render('user/ship-operations/edit', [
            'operation' => $shipOperation->load(['ship.country', 'ship.shippingLine', 'cargoType']),
            'countries' => $countries,
            'shippingLines' => $shippingLines,
            'cargoTypes' => $cargoTypes,
            'ships' => $ships,
        ]);
    }

    public function update(Request $request, ShipOperation $shipOperation)
    {
        $this->authorize('update', $shipOperation);

        $validated = $request->validate([
            'ship_id' => 'required|exists:ships,id',
            'cargo_type_id' => 'required|exists:cargo_types,id',
            'operation_date' => 'required|date',
            'unloading_tonnage' => 'required|numeric|min:0', // Allow up to 3 decimal places
            'loading_tonnage' => 'required|numeric|min:0', // Allow up to 3 decimal places
            'remarks' => 'nullable|string|max:1000',
        ]);


        $shipOperation->update($validated);

        return redirect()->route('user.ship-operations.index')
            ->with('success', 'Data operasi kapal berhasil diperbarui.');
    }

    public function destroy(ShipOperation $shipOperation)
    {
        $this->authorize('delete', $shipOperation);

        $shipOperation->delete();

        return redirect()->route('user.ship-operations.index')
            ->with('success', 'Data operasi kapal berhasil dihapus.');
    }

    public function export(Request $request)
    {
        $filters = $request->only([
            'search',
            'date_from',
            'date_to',
            'cargo_category',
            'shipping_line'
        ]);

        $period = $request->get('period', 'monthly');
        $yearsInput = $request->get('years', Carbon::now()->year);

        // Validasi periode
        $validPeriods = ['monthly', 'quarterly', 'semi-annual', 'annual'];
        if (!in_array($period, $validPeriods)) {
            $period = 'monthly';
        }

        // Konversi years ke array
        $years = is_array($yearsInput) ? $yearsInput : explode(',', $yearsInput);
        $years = array_unique(array_map('intval', $years));

        // Validasi tahun (2020 - tahun depan)
        $currentYear = Carbon::now()->year;
        $years = array_filter($years, fn($y) => $y >= 2020 && $y <= $currentYear + 1);

        // Default ke tahun berjalan jika tidak ada yang valid
        if (empty($years)) {
            $years = [$currentYear];
        }

        // Urutkan tahun dari terkecil ke terbesar
        sort($years);

        $filename = $this->generateExportFilename($period, $years);

        return Excel::download(
            new ShipOperationExport($filters, $period, $years,),
            $filename
        );
    }

    private function generateExportFilename(string $period, array $years): string
    {
        $periodNames = [
            'monthly' => 'Bulanan',
            'quarterly' => 'Triwulan',
            'semi-annual' => 'Semester',
            'annual' => 'Tahunan'
        ];

        $periodName = $periodNames[$period] ?? 'Bulanan';

        if (count($years) > 1) {
            $yearsRange = reset($years) . '-' . end($years);
            return "Laporan Produksi {$periodName} {$yearsRange}.xlsx";
        }

        return "Laporan Produksi {$periodName} {$years[0]}.xlsx";
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls|max:2048',
        ]);

        try {
            Log::info('Starting import process');

            $import = new ShipOperationImport;
            Excel::import($import, $request->file('file'));

            Log::info('Import process completed');

            return redirect()->route('user.ship-operations.index')
                ->with('success', 'Data berhasil diimpor! Silakan cek log untuk detail.');

        } catch (\Exception $e) {
            Log::error('Import error: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            return redirect()->route('user.ship-operations.index')
                ->with('error', 'Gagal mengimpor data: ' . $e->getMessage());
        }
    }

    public function getShipsByLine(Request $request)
    {
        $ships = Ship::with(['country', 'shippingLine'])
            ->when($request->shipping_line_id, function ($query, $shippingLineId) {
                return $query->where('shipping_line_id', $shippingLineId);
            })
            ->when($request->country_id, function ($query, $countryId) {
                return $query->where('country_id', $countryId);
            })
            ->orderBy('name')
            ->get();

        return response()->json($ships);
    }

    public function analytics(Request $request)
    {
        $userId = Auth::id();
        $query = ShipOperation::where('user_id', $userId);

        // Apply date filters if provided
        if ($request->filled('date_from')) {
            $query->where('operation_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('operation_date', '<=', $request->date_to);
        }

        // Get the period for grouping (default to month)
        $period = $request->get('period', 'month');

        // Summary statistics
        $summaryQuery = clone $query;
        $summary = [
            'totalOperations' => $summaryQuery->count(),
            'totalTonnage' => $summaryQuery->sum(DB::raw('unloading_tonnage + loading_tonnage')),
            'totalUnloading' => $summaryQuery->sum('unloading_tonnage'),
            'totalLoading' => $summaryQuery->sum('loading_tonnage'),
            'activeShips' => $summaryQuery->distinct('ship_id')->count('ship_id'),
            'totalCargoTypes' => CargoType::count()
        ];

        // Trends data based on period
        $trendsQuery = clone $query;
        switch ($period) {
            case 'day':
                $groupFormat = '%Y-%m-%d';
                break;
            case 'week':
                $groupFormat = '%Y-W%v';
                break;
            case 'month':
                $groupFormat = '%Y-%m';
                break;
            case 'quarter':
                $groupFormat = '%Y-Q%q';
                break;
            default:
                $groupFormat = '%Y';
        }

        $trends = $trendsQuery->selectRaw("
            DATE_FORMAT(operation_date, '$groupFormat') as period,
            SUM(loading_tonnage) as loading,
            SUM(unloading_tonnage) as unloading,
            COUNT(*) as operations,
            SUM(loading_tonnage + unloading_tonnage) as total
        ")
        ->groupBy('period')
        ->orderBy('period')
        ->get();

        // Cargo comparison data
        $cargoComparison = $query->clone()
            ->join('cargo_types', 'ship_operations.cargo_type_id', '=', 'cargo_types.id')
            ->selectRaw('
                cargo_types.name,
                cargo_types.category,
                SUM(loading_tonnage) as loading,
                SUM(unloading_tonnage) as unloading
            ')
            ->groupBy('cargo_types.id', 'cargo_types.name', 'cargo_types.category')
            ->orderByRaw('SUM(loading_tonnage + unloading_tonnage) DESC')
            ->get();

        // Top ships data
        $topShips = $query->clone()
            ->join('ships', 'ship_operations.ship_id', '=', 'ships.id')
            ->join('countries', 'ships.country_id', '=', 'countries.id')
            ->selectRaw('
                ships.name,
                countries.name as country,
                countries.flag_emoji,
                SUM(unloading_tonnage + loading_tonnage) as total_tonnage,
                COUNT(*) as total_operations
            ')
            ->groupBy('ships.id', 'ships.name', 'countries.name', 'countries.flag_emoji')
            ->orderByRaw('SUM(unloading_tonnage + loading_tonnage) DESC')
            ->limit(10)
            ->get();

        // Monthly operations
        $monthlyOperations = $query->clone()
            ->selectRaw('
                DATE_FORMAT(operation_date, "%Y-%m") as month,
                COUNT(*) as operations,
                SUM(unloading_tonnage + loading_tonnage) as tonnage
            ')
            ->groupBy('month')
            ->orderBy('month')
            ->limit(12)
            ->get();

        return Inertia::render('user/ship-operations/analytics/index', [
            'summary' => $summary,
            'trends' => $trends,
            'cargoComparison' => $cargoComparison,
            'topShips' => $topShips,
            'monthlyOperations' => $monthlyOperations,
        ]);
    }

    public function getTonnageTrends(Request $request)
    {
        $userId = Auth::id();
        $period = $request->get('period', 'month'); // day, week, month, quarter, year

        $query = ShipOperation::where('user_id', $userId);

        // Apply date range if provided
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('operation_date', [$request->date_from, $request->date_to]);
        }

        // Group by period
        switch ($period) {
            case 'day':
                $query->selectRaw('DATE(operation_date) as period,
                    SUM(loading_tonnage) as loading,
                    SUM(unloading_tonnage) as unloading,
                    SUM(loading_tonnage + unloading_tonnage) as total');
                $query->groupBy('period');
                break;
            case 'week':
                $query->selectRaw('YEAR(operation_date) as year, WEEK(operation_date) as week,
                    CONCAT(YEAR(operation_date), " - W", WEEK(operation_date)) as period,
                    SUM(loading_tonnage) as loading,
                    SUM(unloading_tonnage) as unloading,
                    SUM(loading_tonnage + unloading_tonnage) as total');
                $query->groupBy('year', 'week');
                break;
            case 'month':
                $query->selectRaw('YEAR(operation_date) as year, MONTH(operation_date) as month,
                    CONCAT(YEAR(operation_date), "-", MONTH(operation_date)) as period,
                    SUM(loading_tonnage) as loading,
                    SUM(unloading_tonnage) as unloading,
                    SUM(loading_tonnage + unloading_tonnage) as total');
                $query->groupBy('year', 'month');
                break;
            case 'quarter':
                $query->selectRaw('YEAR(operation_date) as year, QUARTER(operation_date) as quarter,
                    CONCAT(YEAR(operation_date), " Q", QUARTER(operation_date)) as period,
                    SUM(loading_tonnage) as loading,
                    SUM(unloading_tonnage) as unloading,
                    SUM(loading_tonnage + unloading_tonnage) as total');
                $query->groupBy('year', 'quarter');
                break;
            case 'year':
                $query->selectRaw('YEAR(operation_date) as period,
                    SUM(loading_tonnage) as loading,
                    SUM(unloading_tonnage) as unloading,
                    SUM(loading_tonnage + unloading_tonnage) as total');
                $query->groupBy('period');
                break;
        }

        $trends = $query->orderBy('period')->get();

        return response()->json($trends);
    }

    public function getCargoComparison(Request $request)
    {
        $userId = Auth::id();

        $comparison = ShipOperation::where('user_id', $userId)
            ->join('cargo_types', 'ship_operations.cargo_type_id', '=', 'cargo_types.id')
            ->selectRaw('cargo_types.name,
                SUM(loading_tonnage) as loading,
                SUM(unloading_tonnage) as unloading')
            ->groupBy('cargo_types.id', 'cargo_types.name')
            ->orderBy('cargo_types.name')
            ->get();

        return response()->json($comparison);
    }

    public function getSummaryData(Request $request)
    {
        $userId = Auth::id();
        $query = ShipOperation::where('user_id', $userId);

        // Apply date range if provided
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('operation_date', [$request->date_from, $request->date_to]);
        }

        // Get base statistics
        $totalOperations = $query->count();
        $totalTonnage = $query->sum(\DB::raw('unloading_tonnage + loading_tonnage'));
        $totalUnloading = $query->sum('unloading_tonnage');
        $totalLoading = $query->sum('loading_tonnage');

        // Get number of active ships
        $activeShips = $query->distinct('ship_id')->count('ship_id');

        // Get total cargo types
        $totalCargoTypes = CargoType::whereIn('id', function($subquery) use ($userId) {
            $subquery->select('cargo_type_id')
                ->from('ship_operations')
                ->where('user_id', $userId)
                ->distinct();
        })->count();

        // Calculate growth (comparing to previous period)
        $currentPeriodStart = $request->date_from ?? Carbon::now()->startOfMonth();
        $currentPeriodEnd = $request->date_to ?? Carbon::now();
        $currentPeriodDays = Carbon::parse($currentPeriodStart)->diffInDays(Carbon::parse($currentPeriodEnd));

        $previousPeriodStart = Carbon::parse($currentPeriodStart)->subDays($currentPeriodDays);
        $previousPeriodOperations = ShipOperation::where('user_id', $userId)
            ->whereBetween('operation_date', [$previousPeriodStart, $currentPeriodStart])
            ->count();

        $operationsGrowth = $previousPeriodOperations > 0
            ? (($totalOperations - $previousPeriodOperations) / $previousPeriodOperations * 100)
            : 0;

        return response()->json([
            'totalOperations' => $totalOperations,
            'totalTonnage' => $totalTonnage,
            'totalUnloading' => $totalUnloading,
            'totalLoading' => $totalLoading,
            'activeShips' => $activeShips,
            'totalCargoTypes' => $totalCargoTypes,
            'operationsGrowth' => round($operationsGrowth, 1),
            'avgTonnagePerOperation' => $totalOperations > 0 ? round($totalTonnage / $totalOperations, 1) : 0
        ]);
    }

    public function getTopShips(Request $request)
    {
        $userId = Auth::id();
        $query = ShipOperation::where('user_id', $userId);

        // Apply date range if provided
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->whereBetween('operation_date', [$request->date_from, $request->date_to]);
        }

        $topShips = $query->join('ships', 'ship_operations.ship_id', '=', 'ships.id')
            ->join('countries', 'ships.country_id', '=', 'countries.id')
            ->selectRaw('
                ships.name,
                countries.name as country,
                countries.flag_emoji,
                SUM(unloading_tonnage + loading_tonnage) as total_tonnage,
                COUNT(*) as total_operations
            ')
            ->groupBy('ships.id', 'ships.name', 'countries.name', 'countries.flag_emoji')
            ->orderByRaw('SUM(unloading_tonnage + loading_tonnage) DESC')
            ->limit(10)
            ->get();

        return response()->json($topShips);
    }
}



