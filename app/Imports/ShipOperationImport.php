<?php
namespace App\Imports;

use App\Imports\SheetProcessor;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class ShipOperationImport implements WithMultipleSheets, SkipsUnknownSheets
{
    public function sheets(): array
    {
        return [
            // Process all sheets with same logic
            0 => new SheetProcessor(),
            1 => new SheetProcessor(),
            2 => new SheetProcessor(),
            3 => new SheetProcessor(),
            4 => new SheetProcessor(),
        ];
    }

    public function onUnknownSheet($sheetName)
    {
        Log::info("Unknown sheet skipped: {$sheetName}");
    }
}
