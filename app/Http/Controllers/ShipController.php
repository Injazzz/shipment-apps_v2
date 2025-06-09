<?php
// app/Http/Controllers/ShipController.php
namespace App\Http\Controllers;
use App\Models\Ship;
use Inertia\Inertia;
use App\Models\Country;
use App\Models\ShippingLine;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class ShipController extends Controller
{
    public function index(Request $request)
    {
        $query = Ship::with(['country', 'shippingLine']);

        // Search functionality
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhereHas('shippingLine', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', "%{$searchTerm}%");
                  })
                  ->orWhereHas('country', function ($subQ) use ($searchTerm) {
                      $subQ->where('name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        // Filter by shipping line
        if ($request->filled('shipping_line') && $request->shipping_line !== 'all') {
            $query->where('shipping_line_id', $request->shipping_line);
        }

        // Filter by country
        if ($request->filled('country') && $request->country !== 'all') {
            $query->where('country_id', $request->country);
        }

        // Filter by capacity range
        if ($request->filled('capacity_min')) {
            $query->where('capacity', '>=', $request->capacity_min);
        }

        if ($request->filled('capacity_max')) {
            $query->where('capacity', '<=', $request->capacity_max);
        }

        $ships = $query->latest()->paginate(10)->withQueryString();

        // Get data for filters
        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();

        return Inertia::render('user/ships/index', [
            'ships' => $ships,
            'countries' => $countries,
            'shippingLines' => $shippingLines,
            'filters' => $request->only(['search', 'shipping_line', 'country', 'capacity_min', 'capacity_max'])
        ]);
    }

    public function create()
    {
        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();
        return Inertia::render('user/ships/create', [
            'countries' => $countries,
            'shippingLines' => $shippingLines,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'shipping_line_id' => 'required|exists:shipping_lines,id',
            'country_id' => 'required|exists:countries,id',
            'capacity' => 'nullable|numeric|min:0',
        ]);

        // Handle new shipping line creation
        if (str_starts_with($validated['shipping_line_id'], 'new_')) {
            $shippingLineName = $request->input('shipping_line_name');
            if ($shippingLineName) {
                $shippingLine = ShippingLine::create([
                    'name' => $shippingLineName,
                    'type' => 'INTER ISLAND' // Use default value from schema
                ]);
                $validated['shipping_line_id'] = $shippingLine->id;
            }
        }

        // Handle new country creation
        if (str_starts_with($validated['country_id'], 'new_')) {
            $countryName = $request->input('country_name');
            $countryCode = $request->input('country_code', strtoupper(substr($countryName, 0, 2)));
            $flagEmoji = $request->input('flag_emoji', '🏳️');
            if ($countryName) {
                $country = Country::create([
                    'name' => $countryName,
                    'code' => $countryCode,
                    'flag_emoji' => $flagEmoji
                ]);
                $validated['country_id'] = $country->id;
            }
        }

        Ship::create($validated);
        return redirect()->route('user.ships.index')
            ->with('success', 'Data kapal berhasil ditambahkan.');
    }

    public function edit(Ship $ship)
    {
        $countries = Country::orderBy('name')->get();
        $shippingLines = ShippingLine::orderBy('name')->get();
        return Inertia::render('user/ships/edit', [
            'ship' => $ship->load(['country', 'shippingLine']),
            'countries' => $countries,
            'shippingLines' => $shippingLines,
        ]);
    }

    public function update(Request $request, Ship $ship)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'shipping_line_id' => 'required|exists:shipping_lines,id',
            'country_id' => 'required|exists:countries,id',
            'capacity' => 'nullable|numeric|min:0',
        ]);

        // Handle new shipping line creation
        if (str_starts_with($validated['shipping_line_id'], 'new_')) {
            $shippingLineName = $request->input('shipping_line_name');
            if ($shippingLineName) {
                $shippingLine = ShippingLine::create([
                    'name' => $shippingLineName,
                    'type' => $shippingLineName,
                ]);
                $validated['shipping_line_id'] = $shippingLine->id;
            }
        }

        // Handle new country creation
        if (str_starts_with($validated['country_id'], 'new_')) {
            $countryName = $request->input('country_name');
            $countryCode = $request->input('country_code', strtoupper(substr($countryName, 0, 2)));
            $flagEmoji = $request->input('flag_emoji', '🏳️');
            if ($countryName) {
                $country = Country::create([
                    'name' => $countryName,
                    'code' => $countryCode,
                    'flag_emoji' => $flagEmoji
                ]);
                $validated['country_id'] = $country->id;
            }
        }

        $ship->update($validated);
        return redirect()->route('user.ships.index')
            ->with('success', 'Data kapal berhasil diperbarui.');
    }

    public function destroy(Ship $ship)
    {
        $ship->delete();
        return redirect()->route('user.ships.index')
            ->with('success', 'Data kapal berhasil dihapus.');
    }

    public function searchShippingLines(Request $request)
    {
        $query = $request->get('q');
        $shippingLines = ShippingLine::where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get();
        return response()->json($shippingLines);
    }

    public function searchCountries(Request $request)
    {
        $query = $request->get('q');
        $countries = Country::where('name', 'like', "%{$query}%")
            ->orderBy('name')
            ->limit(10)
            ->get();
        return response()->json($countries);
    }

    public function storeShippingLine(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:shipping_lines,name',
            'type' => 'nullable|string|max:100'
        ]);

        try {
            $shippingLine = ShippingLine::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
            ]);
            return response()->json([
                'success' => true,
                'data' => $shippingLine,
                'message' => 'Shipping line created successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function storeCountry(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100|unique:countries,name',
                'code' => 'required|string|size:2|unique:countries,code',
                'alpha3' => 'required|string|size:3|unique:countries,alpha3',
                'flag_emoji' => 'nullable|string|max:10',
            ]);

            $validated['code'] = strtoupper($validated['code']);
            $validated['alpha3'] = strtoupper($validated['alpha3']);
            $validated['flag_emoji'] = $validated['flag_emoji'] ?: '🏳️';

            $country = Country::create($validated);
            return response()->json([
                'success' => true,
                'data' => $country,
                'message' => 'Negara berhasil ditambahkan.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
