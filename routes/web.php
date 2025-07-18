<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShipController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\ShipOperationController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// User routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('user')->name('user.')->group(function () {
        Route::get('/dashboard', function () {
            return Inertia::render('user/dashboard');
        })->name('dashboard');

        // Ship Operations Routes
        Route::prefix('ship-operations')->name('ship-operations.')->group(function () {
            Route::get('/', [ShipOperationController::class, 'index'])->name('index');
            Route::get('/create', [ShipOperationController::class, 'create'])->name('create');
            Route::post('/', [ShipOperationController::class, 'store'])->name('store');
            Route::get('/{shipOperation}', [ShipOperationController::class, 'show'])->name('show');
            Route::get('/{shipOperation}/edit', [ShipOperationController::class, 'edit'])->name('edit');
            Route::put('/{shipOperation}', [ShipOperationController::class, 'update'])->name('update');
            Route::delete('/{shipOperation}', [ShipOperationController::class, 'destroy'])->name('destroy');
            Route::get('/export/excel', [ShipOperationController::class, 'export'])->name('export');
            Route::post('/import/excel', [ShipOperationController::class, 'import'])->name('import');
            Route::prefix('analytics')->name('analytics.')->group(function () {
                Route::get('/index', [ShipOperationController::class, 'analytics'])->name('index');
                Route::get('/data', [ShipOperationController::class, 'getAnalyticsData'])->name('data');
                Route::get('/trends', [ShipOperationController::class, 'getTonnageTrends'])->name('trends');
                Route::get('/cargo-comparison', [ShipOperationController::class, 'getCargoComparison'])->name('cargo-comparison');
                Route::get('/top-ships', [ShipOperationController::class, 'getTopShips'])->name('top-ships');
                Route::get('/monthly-data', [ShipOperationController::class, 'getMonthlyData'])->name('monthly-data');
                Route::get('/summary', [ShipOperationController::class, 'getSummaryData'])->name('summary');
                // Route::get('/export-report', [ShipOperationController::class, 'exportAnalyticsReport'])->name('export-report');
            });
        });

        // Ships Routes
        Route::prefix('ships')->name('ships.')->group(function () {
            Route::get('/', [ShipController::class, 'index'])->name('index');
            Route::get('/create', [ShipController::class, 'create'])->name('create');
            Route::post('/', [ShipController::class, 'store'])->name('store');
            Route::get('/{ship}/edit', [ShipController::class, 'edit'])->name('edit');
            Route::put('/{ship}', [ShipController::class, 'update'])->name('update');
            Route::delete('/{ship}', [ShipController::class, 'destroy'])->name('destroy');
            Route::get('/shipping-lines/search', [ShipController::class, 'searchShippingLines'])->name('shipping-lines.search');
            Route::get('/countries/search', [ShipController::class, 'searchCountries'])->name('countries.search');
            Route::post('/shipping-lines', [ShipController::class, 'storeShippingLine'])->name('shipping-lines.store');
            Route::post('/countries', [ShipController::class, 'storeCountry'])->name('countries.store');
        });

        // API Routes for dynamic data
        Route::get('/api/ships-by-line', [ShipOperationController::class, 'getShipsByLine'])->name('api.ships-by-line');
    });
});

// Admin routes
Route::middleware(['auth', 'verified', 'admin'])->group(function () {
    Route::prefix('admin')->name('admin.')->group(function () {
        // Admin dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // User management
        Route::resource('users', UserController::class);
        Route::post('users/{user}/generate-password', [UserController::class, 'generatePassword'])
            ->name('users.generate-password');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
