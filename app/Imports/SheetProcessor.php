<?php
namespace App\Imports;

use App\Models\Ship;
use App\Models\Country;
use App\Models\CargoType;
use App\Models\ShippingLine;
use App\Models\ShipOperation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\Log;

class SheetProcessor implements ToCollection
{
    public function collection(Collection $rows)
    {
        Log::info("Processing sheet with " . $rows->count() . " rows");
        if ($rows->isEmpty()) {
            Log::info("Sheet is empty, skipping");
            return;
        }
        
        Log::info("First 3 rows:", $rows->take(3)->toArray());
        
        if (!$this->shouldProcessSheet($rows)) {
            Log::info("Sheet doesn't match criteria, skipping");
            return;
        }
        
        Log::info("Sheet matches criteria, processing...");
        $this->processSheet($rows);
    }
    
    private function shouldProcessSheet(Collection $rows): bool
    {
        foreach ($rows as $row) {
            $rowText = strtoupper(implode(' ', $row->toArray()));
            if (strpos($rowText, 'DATA PRODUKSI TAHUN') !== false &&
                strpos($rowText, 'IKPP MERAK') !== false) {
                Log::info("Sheet matches content criteria");
                return true;
            }
        }
        return false;
    }
    
    private function processSheet(Collection $rows)
    {
        $currentGCMonth = null;
        $currentGCYear = null;
        $currentContainerMonth = null;
        $currentContainerYear = null;
        $dataProcessed = 0;
        
        foreach ($rows as $index => $row) {
            Log::info("Row {$index}: " . json_encode($row->toArray()));
            
            if ($this->isEmptyRow($row)) {
                Log::info("Row {$index}: Empty row, skipping");
                continue;
            }
            
            if ($this->isTotalRow($row)) {
                Log::info("Row {$index}: Total row, skipping");
                continue;
            }
            
            // Check for month/year in both GC and Container sections
            $gcMonthYear = $this->extractMonthYearFromColumn($row, 'GC'); // Column A
            $containerMonthYear = $this->extractMonthYearFromColumn($row, 'CONTAINER'); // Column I
            
            if ($gcMonthYear) {
                $currentGCMonth = $gcMonthYear['month'];
                $currentGCYear = $gcMonthYear['year'];
                Log::info("Row {$index}: Found GC month/year: {$currentGCMonth}/{$currentGCYear}");
            }
            
            if ($containerMonthYear) {
                $currentContainerMonth = $containerMonthYear['month'];
                $currentContainerYear = $containerMonthYear['year'];
                Log::info("Row {$index}: Found Container month/year: {$currentContainerMonth}/{$currentContainerYear}");
            }
            
            if ($gcMonthYear || $containerMonthYear) {
                continue; // Skip month/year rows
            }
            
            if ($this->isHeaderRow($row)) {
                Log::info("Row {$index}: Header row, skipping");
                continue;
            }
            
            // Process GC data (columns A-G) - FIXED MAPPING
            if ($currentGCMonth && $currentGCYear && $this->isGCDataRow($row)) {
                Log::info("Row {$index}: Processing GC data");
                $this->processGCDataRow($row, $currentGCMonth, $currentGCYear);
                $dataProcessed++;
            }
            
            // Process Container data (columns I-O)  
            if ($currentContainerMonth && $currentContainerYear && $this->isContainerDataRow($row)) {
                Log::info("Row {$index}: Processing Container data");
                $this->processContainerDataRow($row, $currentContainerMonth, $currentContainerYear, 'CONTAINER');
                $dataProcessed++;
            }
        }
        
        Log::info("Sheet processing complete. Processed {$dataProcessed} data rows");
    }
    
    private function isEmptyRow($row): bool
    {
        return $row->filter()->isEmpty();
    }
    
    private function isTotalRow($row): bool
    {
        $firstCell = strtoupper(trim($row[0] ?? ''));
        $containerFirstCell = strtoupper(trim($row[8] ?? ''));
        
        return $firstCell === 'TOTAL' || $containerFirstCell === 'TOTAL';
    }
    
    private function extractMonthYearFromColumn($row, $section): ?array
    {
        $months = [
            'JANUARI' => 1, 'FEBRUARI' => 2, 'MARET' => 3, 'APRIL' => 4,
            'MEI' => 5, 'JUNI' => 6, 'JULI' => 7, 'AGUSTUS' => 8,
            'SEPTEMBER' => 9, 'OKTOBER' => 10, 'NOVEMBER' => 11, 'DESEMBER' => 12,
            'JAN' => 1, 'FEB' => 2, 'MAR' => 3, 'APR' => 4,
            'MAY' => 5, 'JUN' => 6, 'JUL' => 7, 'AUG' => 8,
            'SEP' => 9, 'OCT' => 10, 'NOV' => 11, 'DEC' => 12
        ];
        
        $cellIndex = ($section === 'GC') ? 0 : 8; // Column A or I
        $cell = strtoupper(trim($row[$cellIndex] ?? ''));
        
        foreach ($months as $monthName => $monthNumber) {
            if (strpos($cell, $monthName) !== false) {
                // Look for year in the same cell
                preg_match('/(\d{4})/', $cell, $matches);
                $year = $matches[1] ?? date('Y');
                
                Log::info("Found {$section} month/year: {$monthName} {$year} in cell: {$cell}");
                return [
                    'month' => $monthNumber,
                    'year' => (int) $year
                ];
            }
        }
        
        return null;
    }
    
    private function isHeaderRow($row): bool
    {
        $firstCell = strtoupper(trim($row[0] ?? ''));
        $containerFirstCell = strtoupper(trim($row[8] ?? ''));
        
        return $firstCell === 'NO' || 
               strpos($firstCell, 'NAMA KAPAL') !== false ||
               $containerFirstCell === 'NO' ||
               strpos($containerFirstCell, 'NAMA KAPAL') !== false;
    }
    
    private function isGCDataRow($row): bool
    {
        $firstCell = trim($row[0] ?? '');
        $shipName = trim($row[1] ?? '');
        
        // Must have numeric ID and ship name
        $isValid = is_numeric($firstCell) && !empty($shipName) && 
                   !in_array(strtoupper($shipName), ['NO', 'NAMA KAPAL', 'TOTAL']);
        
        if ($isValid) {
            Log::info("GC Data row detected: No={$firstCell}, Ship={$shipName}");
        }
        
        return $isValid;
    }
    
    private function isContainerDataRow($row): bool
    {
        $firstCell = trim($row[8] ?? '');  // Column I
        $shipName = trim($row[9] ?? '');   // Column J
        
        // Check if we have numeric ID in column I
        $hasNumericId = is_numeric($firstCell);
        
        // Check if we have ship name in column J
        $hasShipName = !empty($shipName) && 
                       !in_array(strtoupper($shipName), ['NO', 'NAMA KAPAL', 'TOTAL']);
        
        // Additional check: see if there's any container data in columns K-O
        $hasContainerData = false;
        for ($i = 10; $i <= 14; $i++) { // Columns K to O
            if (!empty(trim($row[$i] ?? ''))) {
                $hasContainerData = true;
                break;
            }
        }
        
        // Consider it container data if:
        // 1. Has numeric ID AND ship name, OR
        // 2. Has ship name AND some container data, OR  
        // 3. Row explicitly mentions "KAPAL" (for summary rows)
        $isValid = ($hasNumericId && $hasShipName) || 
                   ($hasShipName && $hasContainerData) ||
                   (strtoupper($shipName) === 'KAPAL' && $hasContainerData);
        
        if ($isValid) {
            Log::info("Container Data row detected: No={$firstCell}, Ship={$shipName}, HasData=" . ($hasContainerData ? 'Yes' : 'No'));
        }
        
        return $isValid;
    }
    
    /**
     * FIXED: Correct column mapping for GC data
     * Based on CSV structure: NO, NAMA KAPAL, LINE, BENDERA, CARGO, T/BONGKAR, T/MUAT
     */
    private function processGCDataRow($row, $month, $year)
    {
        try {
            // CORRECTED COLUMN MAPPING FOR GC DATA
            $shipName = trim($row[1] ?? '');          // Column B - NAMA KAPAL
            $shippingLineName = trim($row[2] ?? '');  // Column C - LINE  
            $countryName = trim($row[3] ?? '');       // Column D - BENDERA (Flag/Country)
            $cargoName = trim($row[4] ?? '');         // Column E - CARGO
            $unloadingTonnage = $this->parseNumeric($row[5] ?? 0); // Column F - T/BONGKAR
            $loadingTonnage = $this->parseNumeric($row[6] ?? 0);   // Column G - T/MUAT
            
            Log::info("Processing GC: Ship={$shipName}, Line={$shippingLineName}, Country={$countryName}, Cargo={$cargoName}, Unload={$unloadingTonnage}, Load={$loadingTonnage}");
            
            // Validation
            if (empty($shipName)) {
                Log::warning("Skipping GC row: Empty ship name");
                return;
            }
            
            if (empty($cargoName)) {
                Log::warning("Skipping GC row: Empty cargo name for ship {$shipName}");
                return;
            }
            
            // Set defaults for empty fields
            if (empty($shippingLineName)) {
                $shippingLineName = 'Unknown';
            }
            
            if (empty($countryName)) {
                $countryName = 'Unknown';
            }
            
            $this->createOperation($shipName, $shippingLineName, $countryName, $cargoName, 
                               $unloadingTonnage, $loadingTonnage, $month, $year, 'GC');
            
        } catch (\Exception $e) {
            Log::error("Error processing GC row: " . $e->getMessage());
            Log::error("Row data: " . json_encode($row->toArray()));
        }
    }
    
    private function processContainerDataRow($row, $month, $year, $category)
    {
        try {
            // Container data starts from column I (index 8)
            $shipName = trim($row[9] ?? '');         // Column J - NAMA KAPAL
            $shippingLineName = trim($row[10] ?? ''); // Column K - LINE
            $countryName = trim($row[11] ?? '');      // Column L - BENDERA
            $cargoName = trim($row[12] ?? '');        // Column M - CARGO
            $unloadingTonnage = $this->parseNumeric($row[13] ?? 0); // Column N - T/BONGKAR
            $loadingTonnage = $this->parseNumeric($row[14] ?? 0);   // Column O - T/MUAT
            
            // Handle special case where ship name is "KAPAL" (summary row)
            if (strtoupper($shipName) === 'KAPAL') {
                $shipName = 'Container Summary ' . $month . '/' . $year;
                $cargoName = 'CONTAINER';
            }
            
            // If cargo name is empty, default to CONTAINER
            if (empty($cargoName)) {
                $cargoName = 'CONTAINER';
            }
            
            Log::info("Processing Container: Ship={$shipName}, Line={$shippingLineName}, Country={$countryName}, Cargo={$cargoName}, Unload={$unloadingTonnage}, Load={$loadingTonnage}");
            
            if (empty($shipName)) {
                Log::warning("Skipping Container row: Empty ship name");
                return;
            }
            
            // Allow empty shipping line and country for container data
            if (empty($shippingLineName)) {
                $shippingLineName = 'Unknown';
            }
            if (empty($countryName)) {
                $countryName = 'Unknown';
            }
            
            $this->createOperation($shipName, $shippingLineName, $countryName, $cargoName, 
                               $unloadingTonnage, $loadingTonnage, $month, $year, $category);
            
        } catch (\Exception $e) {
            Log::error("Error processing Container row: " . $e->getMessage());
            Log::error("Container row data: " . json_encode(array_slice($row->toArray(), 8, 7)));
        }
    }
    
    private function createOperation($shipName, $shippingLineName, $countryName, $cargoName, 
                                   $unloadingTonnage, $loadingTonnage, $month, $year, $category)
    {
        $actualCategory = $this->determineCategoryFromCargo($cargoName);
        
        $country = $this->getOrCreateCountry($countryName);
        $shippingLine = $this->getOrCreateShippingLine($shippingLineName);
        $cargoType = $this->getOrCreateCargoType($cargoName, $actualCategory);
        $ship = $this->getOrCreateShip($shipName, $country->id, $shippingLine->id);
        
        $operationDate = sprintf('%04d-%02d-01', $year, $month);
        
        $operation = ShipOperation::create([
            'user_id' => Auth::id(),
            'ship_id' => $ship->id,
            'cargo_type_id' => $cargoType->id,
            'operation_date' => $operationDate,
            'unloading_tonnage' => $unloadingTonnage,
            'loading_tonnage' => $loadingTonnage,
            'remarks' => "Imported from Excel - {$actualCategory}",
        ]);
        
        Log::info("Successfully created {$actualCategory} operation ID: " . $operation->id);
    }
    
    private function determineCategoryFromCargo($cargoName): string
    {
        $normalizedCargo = strtoupper(trim($cargoName));
        
        if (strpos($normalizedCargo, 'CONTAINER') !== false) {
            return 'CONTAINER';
        }
        
        return 'GC';
    }
    
    private function parseNumeric($value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }
        
        // Handle empty values
        if (empty($value) || trim($value) === '') {
            return 0.0;
        }
        
        $cleaned = preg_replace('/[^0-9.,]/', '', $value);
        if (strpos($cleaned, ',') !== false && strpos($cleaned, '.') !== false) {
            $cleaned = str_replace(',', '', $cleaned);
        } elseif (strpos($cleaned, ',') !== false) {
            $cleaned = str_replace(',', '.', $cleaned);
        }
        
        return (float) $cleaned;
    }
    
    // Keep all your existing helper methods unchanged
    private function getOrCreateCountry($countryName): Country
    {
        if (empty(trim($countryName))) {
            $countryName = 'Unknown';
        }
        
        $normalizedName = $this->normalizeCountryName($countryName);
        $country = $this->findExistingCountry($normalizedName);
        
        if (!$country) {
            $country = Country::create([
                'name' => $normalizedName,
                'code' => $this->generateCountryCode($normalizedName),
                'alpha3' => $this->generateAlpha3Code($normalizedName),
                'flag_emoji' => '🏳️',
            ]);
            Log::info("Created new country: " . $normalizedName);
        }
        
        return $country;
    }
    
    private function findExistingCountry($countryName): ?Country
    {
        $normalizedInput = $this->normalizeCountryForMatching($countryName);
        
        $country = Country::whereRaw('UPPER(name) = ?', [strtoupper($countryName)])->first();
        if ($country) {
            Log::info("Found exact match for country: " . $countryName);
            return $country;
        }
        
        $allCountries = Country::all();
        
        foreach ($allCountries as $dbCountry) {
            $normalizedDb = $this->normalizeCountryForMatching($dbCountry->name);
            
            if ($normalizedInput === $normalizedDb) {
                Log::info("Found flexible match: '{$countryName}' matches '{$dbCountry->name}'");
                return $dbCountry;
            }
        }
        
        Log::info("No match found for country: " . $countryName);
        return null;
    }
    
    private function normalizeCountryForMatching($countryName): string
    {
        $normalized = strtoupper(trim($countryName));
        
        $replacements = [
            '&' => 'AND',
            ' AND ' => ' AND ',
            '  ' => ' ',
            'HONG KONG' => 'HONGKONG',
            'HONGKONG' => 'HONG KONG',
            'SINGAPURA' => 'SINGAPORE',
            'SINGAPORE' => 'SINGAPURA',
        ];
        
        foreach ($replacements as $search => $replace) {
            $normalized = str_replace($search, $replace, $normalized);
        }
        
        return trim($normalized);
    }
    
    private function normalizeCountryName($countryName): string
    {
        $countryName = trim($countryName);
        $countryMappings = [
            'INDONESIA' => 'Indonesia',
            'PANAMA' => 'Panama',
            'LIBERIA' => 'Liberia',
            'VIETNAM' => 'Vietnam',
            'SINGAPURA' => 'Singapore',
            'SINGAPORE' => 'Singapore',
            'HONGKONG' => 'Hong Kong',
            'HONG KONG' => 'Hong Kong',
        ];
        
        $upperCountryName = strtoupper($countryName);
        return $countryMappings[$upperCountryName] ?? ucwords(strtolower($countryName));
    }
    
    private function generateCountryCode($countryName): string
    {
        $code = strtoupper(substr($countryName, 0, 2));
        
        $commonCodes = [
            'INDONESIA' => 'ID',
            'SINGAPORE' => 'SG',
            'SINGAPURA' => 'SG',
            'MALAYSIA' => 'MY',
            'THAILAND' => 'TH',
            'PHILIPPINES' => 'PH',
            'VIETNAM' => 'VN',
            'CHINA' => 'CN',
            'JAPAN' => 'JP',
            'KOREA' => 'KR',
            'HONG KONG' => 'HK',
            'HONGKONG' => 'HK',
            'PANAMA' => 'PA',
            'LIBERIA' => 'LR',
            'MARSHALL ISLANDS' => 'MH',
            'BAHAMAS' => 'BS',
            'MALTA' => 'MT',
            'NORWAY' => 'NO',
            'NORWEGIAN' => 'NO',
            'UNITED STATES' => 'US',
            'UNITED KINGDOM' => 'GB',
            'NETHERLANDS' => 'NL',
            'GERMANY' => 'DE',
            'FRANCE' => 'FR',
            'ITALY' => 'IT',
            'SPAIN' => 'ES',
            'GREECE' => 'GR',
            'TURKEY' => 'TR',
            'INDIA' => 'IN',
            'AUSTRALIA' => 'AU',
            'NEW ZEALAND' => 'NZ',
            'CANADA' => 'CA',
            'BRAZIL' => 'BR',
            'ARGENTINA' => 'AR',
            'CHILE' => 'CL',
            'MEXICO' => 'MX',
            'SOUTH AFRICA' => 'ZA',
            'EGYPT' => 'EG',
            'RUSSIA' => 'RU',
            'UKRAINE' => 'UA',
            'POLAND' => 'PL',
            'SWEDEN' => 'SE',
            'DENMARK' => 'DK',
            'FINLAND' => 'FI',
            'BELGIUM' => 'BE',
            'PORTUGAL' => 'PT',
            'IRELAND' => 'IE',
            'AUSTRIA' => 'AT',
            'SWITZERLAND' => 'CH',
            'CZECH REPUBLIC' => 'CZ',
            'HUNGARY' => 'HU',
            'ROMANIA' => 'RO',
            'BULGARIA' => 'BG',
            'CROATIA' => 'HR',
            'SERBIA' => 'RS',
            'SLOVENIA' => 'SI',
            'SLOVAKIA' => 'SK',
            'ESTONIA' => 'EE',
            'LATVIA' => 'LV',
            'LITHUANIA' => 'LT',
            'ANTIGUA AND BARBUDA' => 'AG',
            'ANTIGUA & BARBUDA' => 'AG',
        ];
        
        $upperCountryName = strtoupper($countryName);
        if (isset($commonCodes[$upperCountryName])) {
            $code = $commonCodes[$upperCountryName];
        }
        
        $counter = 1;
        $originalCode = $code;
        
        while (Country::where('code', $code)->exists()) {
            if (strlen($originalCode) == 2) {
                $code = $originalCode . $counter;
            } else {
                $code = substr($originalCode, 0, 1) . $counter;
            }
            $counter++;
            
            if ($counter > 99) {
                $code = strtoupper(substr(uniqid(), 0, 2));
                break;
            }
        }
        
        return $code;
    }
    
    private function generateAlpha3Code($countryName): string
    {
        $alpha3 = strtoupper(substr($countryName, 0, 3));
        $counter = 1;
        $originalAlpha3 = $alpha3;
        
        while (Country::where('alpha3', $alpha3)->exists()) {
            $alpha3 = substr($originalAlpha3, 0, 2) . $counter;
            $counter++;
        }
        
        return $alpha3;
    }
    
    private function getOrCreateShippingLine($shippingLineName): ShippingLine
    {
        $normalizedName = trim($shippingLineName);
        if (empty($normalizedName)) {
            $normalizedName = 'Unknown';
        }
        
        $shippingLine = ShippingLine::where('name', $normalizedName)->first();
        
        if (!$shippingLine) {
            $type = (strtoupper($normalizedName) === 'OCEAN GOING') ? 'OCEAN GOING' : 'INTER ISLAND';
            $shippingLine = ShippingLine::create([
                'name' => $normalizedName,
                'type' => $type,
            ]);
            Log::info("Created new shipping line: " . $normalizedName);
        }
        
        return $shippingLine;
    }
    
    private function getOrCreateCargoType($cargoName, $category): CargoType
    {
        $normalizedName = trim($cargoName);
        if (empty($normalizedName)) {
            $normalizedName = 'Unknown';
        }
        
        $cargoType = CargoType::where('name', $normalizedName)->first();
        
        if (!$cargoType) {
            $cargoType = CargoType::create([
                'name' => $normalizedName,
                'category' => $category,
            ]);
            Log::info("Created new cargo type: " . $normalizedName);
        }
        
        return $cargoType;
    }
    
    private function getOrCreateShip($shipName, $countryId, $shippingLineId): Ship
    {
        $normalizedName = trim($shipName);
        $ship = Ship::where('name', $normalizedName)->first();
        
        if (!$ship) {
            $ship = Ship::create([
                'name' => $normalizedName,
                'country_id' => $countryId,
                'shipping_line_id' => $shippingLineId,
            ]);
            Log::info("Created new ship: " . $normalizedName);
        }
        
        return $ship;
    }
}