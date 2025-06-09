<?php
namespace App\Exports;
use App\Models\ShipOperation;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
class ShipOperationExport implements FromArray, WithStyles, WithTitle, WithColumnWidths
{
    protected $filters;
    protected $period;
    protected $year;
    protected $monthRowPositions = []; // Track row positions for styling
    protected $totalRowPositions = [];
    protected $summaryStartRow = 0;
    protected $summaryHeaderRows = [];
    protected $dataRowRanges = []; // Track actual data ranges for borders
    protected $periodDateRow = 0; // Track row for period date
    protected $signatureRow = 0; // Track row for signature
    public function __construct(array $filters = [], string $period = 'monthly', int $year = null)
    {
        $this->filters = $filters;
        $this->period = $period;
        $this->year = $year ?? Carbon::now()->year;
    }
    public function array(): array
    {
        $data = [];
        $currentRow = 1;
        $periodRanges = $this->getPeriodRanges();
        // Header utama - merge sampai kolom O
        $data[] = [
            "DATA PRODUKSI TAHUN {$this->year} IKPP MERAK", '', '', '', '', '', '', '',
            '', '', '', '', '', '', ''
        ];
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow += 2;
        // Header kategori
        $data[] = [
            'GC', '', '', '', '', '', '', '',
            'CONTAINER', '', '', '', '', '', ''
        ];
        $currentRow++;
        // Header kolom
        $data[] = [
            'NO', 'NAMA KAPAL', 'LINE', 'BENDERA', 'CARGO', 'T/BONGKAR', 'T/MUAT', '',
            'NO', 'NAMA KAPAL', 'LINE', 'BENDERA', 'CARGO', 'T/BONGKAR', 'T/MUAT'
        ];
        $currentRow++;
        foreach ($periodRanges as $periodName => $dateRange) {
            // Get data untuk GC dan Container
            $gcData = $this->getOperationsData('GC', $dateRange['start'], $dateRange['end']);
            $containerData = $this->getOperationsData('CONTAINER', $dateRange['start'], $dateRange['end']);
            // Skip periode jika tidak ada data
            if (empty($gcData) && empty($containerData)) {
                continue;
            }
            // Check if period has any meaningful data (non-zero totals)
            $periodSummary = $this->getPeriodSummary($dateRange['start'], $dateRange['end']);
            if ($periodSummary['total_unloading'] == 0 && $periodSummary['total_loading'] == 0) {
                continue;
            }
            // Row untuk nama periode
            $data[] = [
                $periodName, '', '', '', '', '', '', '',
                $periodName, '', '', '', '', '', ''
            ];
            $this->monthRowPositions[] = $currentRow; // Store current row position
            $currentRow++;
            $dataStartRow = $currentRow; // Track start of data rows
            $maxRows = max(count($gcData), count($containerData));
            for ($i = 0; $i < $maxRows; $i++) {
                $row = [];
                // GC Data
                if (isset($gcData[$i])) {
                    $gc = $gcData[$i];
                    $row = [
                        $i + 1,
                        $gc['ship_name'],
                        $gc['shipping_line'],
                        $gc['country'],
                        $gc['cargo_name'],
                        $gc['unloading_tonnage'] > 0 ? number_format($gc['unloading_tonnage'], 2, ',', '.') : '',
                        $gc['loading_tonnage'] > 0 ? number_format($gc['loading_tonnage'], 2, ',', '.') : '',
                        ''
                    ];
                } else {
                    $row = ['', '', '', '', '', '', '', ''];
                }
                // Container Data
                if (isset($containerData[$i])) {
                    $container = $containerData[$i];
                    $row = array_merge($row, [
                        $i + 1,
                        $container['ship_name'],
                        $container['shipping_line'],
                        $container['country'],
                        $container['cargo_name'],
                        $container['unloading_tonnage'] > 0 ? number_format($container['unloading_tonnage'], 2, ',', '.') : '',
                        $container['loading_tonnage'] > 0 ? number_format($container['loading_tonnage'], 2, ',', '.') : ''
                    ]);
                } else {
                    $row = array_merge($row, ['', '', '', '', '', '', '']);
                }
                $data[] = $row;
                $currentRow++;
            }
            // Summary untuk periode ini
            $gcCount = count($gcData);
            $containerCount = count($containerData);
            $data[] = [
                'TOTAL', '', $gcCount, '', '',
                $periodSummary['gc_unloading'] > 0 ? number_format($periodSummary['gc_unloading'], 2, ',', '.') : '',
                $periodSummary['gc_loading'] > 0 ? number_format($periodSummary['gc_loading'], 2, ',', '.') : '',
                '',
                'TOTAL', '', $containerCount, '', '',
                $periodSummary['container_unloading'] > 0 ? number_format($periodSummary['container_unloading'], 2, ',', '.') : '',
                $periodSummary['container_loading'] > 0 ? number_format($periodSummary['container_loading'], 2, ',', '.') : ''
            ];
            $this->totalRowPositions[] = $currentRow; // Store total row position
            $currentRow++;
            // Store data range for this period (for borders)
            if ($maxRows > 0) {
                $this->dataRowRanges[] = [
                    'start' => $dataStartRow,
                    'end' => $currentRow - 1 // Don't include the next empty row
                ];
            }
            // Empty row between periods
            $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            $currentRow++;
        }            // Add separator before overall summary - single row
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        // Overall Summary with proper formatting
        $this->summaryStartRow = $currentRow;
        $overallSummary = $this->getOverallSummary();
        $data[] = [
            'RINGKASAN KESELURUHAN TAHUN ' . $this->year,
            '', '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $this->summaryHeaderRows[] = $currentRow; // Track main summary header
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = [
            '', 'STATISTIK UMUM', '', '', '', '', '', '',
            '', 'ANALISIS KINERJA', '', '', '', '', ''
        ];
        $this->summaryHeaderRows[] = $currentRow; // Track section headers
        $currentRow++;
        $data[] = [
            '', 'Total Kapal Beroperasi:', $overallSummary['total_ships'], '', '', '', '', '',
            '', 'Kapal Paling Produktif:', $overallSummary['most_productive_ship'], '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'Total Tonnage Bongkar:', number_format($overallSummary['total_unloading'], 2, ',', '.'), '', '', '', '', '',
            '', 'Cargo Terbanyak (Bongkar):', $overallSummary['most_unloaded_cargo'], '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'Total Tonnage Muat:', number_format($overallSummary['total_loading'], 2, ',', '.'), '', '', '', '', '',
            '', 'Cargo Terbanyak (Muat):', $overallSummary['most_loaded_cargo'], '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'Total Tonnage Keseluruhan:', number_format($overallSummary['total_tonnage'], 2, ',', '.'), '', '', '', '', '',
            '', 'Shipping Line Teraktif:', $overallSummary['most_active_line'], '', '', '', ''
        ];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = [
            '', 'BREAKDOWN PER KATEGORI', '', '', '', '', '', '',
            '', '', '', '', '', '', ''
        ];
        $this->summaryHeaderRows[] = $currentRow; // Track breakdown header
        $currentRow++;
        $data[] = [
            '', 'GC - Total Bongkar:', number_format($overallSummary['gc_total_unloading'], 2, ',', '.'),
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'GC - Total Muat:', number_format($overallSummary['gc_total_loading'], 2, ',', '.'),
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'Container - Total Bongkar:', number_format($overallSummary['container_total_unloading'], 2, ',', '.'),
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;
        $data[] = [
            '', 'Container - Total Muat:', number_format($overallSummary['container_total_loading'], 2, ',', '.'),
            '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;

        // Add empty row before period
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        // Periode
        $periodText = $this->getPeriodText();
        $this->periodDateRow = $currentRow;
        $data[] = [
            '', 'Periode:', $periodText, '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;

        // Empty rows before signature
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow += 2;

        // Signature section
        $this->signatureRow = $currentRow;
        $data[] = [
            '', '', '', '', '', '', '', '', '', '', '', '', 'Merak, ' . Carbon::now()->translatedFormat('d F Y'), '', ''
        ];
        $currentRow++;
        $data[] = [
            '', '', '', '', '', '', '', '', '', '', '', '', 'Penanggung Jawab,', '', ''
        ];
        $currentRow++;

        // Empty space for signature
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow += 3;

        $data[] = [
            '', '', '', '', '', '', '', '', '', '', '', '', '(_________________)', '', ''
        ];

        return $data;
    }

    private function getPeriodText(): string
    {
        switch ($this->period) {
            case 'monthly':
                return "Bulanan Tahun {$this->year}";
            case 'quarterly':
                return "Triwulan Tahun {$this->year}";
            case 'semi-annual':
                return "Semester Tahun {$this->year}";
            case 'annual':
                return "Tahunan {$this->year}";
            default:
                return "Tahun {$this->year}";
        }
    }
    private function getPeriodRanges(): array
    {
        $ranges = [];
        switch ($this->period) {
            case 'monthly':
                for ($month = 1; $month <= 12; $month++) {
                    $monthName = Carbon::create($this->year, $month, 1)->format('F Y');
                    $ranges[$monthName] = [
                        'start' => Carbon::create($this->year, $month, 1)->startOfMonth(),
                        'end' => Carbon::create($this->year, $month, 1)->endOfMonth()
                    ];
                }
                break;
            case 'quarterly':
                $quarters = [
                    'Q1 ' . $this->year => ['start' => 1, 'end' => 3],
                    'Q2 ' . $this->year => ['start' => 4, 'end' => 6],
                    'Q3 ' . $this->year => ['start' => 7, 'end' => 9],
                    'Q4 ' . $this->year => ['start' => 10, 'end' => 12],
                ];
                foreach ($quarters as $quarterName => $months) {
                    $ranges[$quarterName] = [
                        'start' => Carbon::create($this->year, $months['start'], 1)->startOfMonth(),
                        'end' => Carbon::create($this->year, $months['end'], 1)->endOfMonth()
                    ];
                }
                break;
            case 'semi-annual':
                $ranges['Semester 1 ' . $this->year] = [
                    'start' => Carbon::create($this->year, 1, 1)->startOfYear(),
                    'end' => Carbon::create($this->year, 6, 30)->endOfDay()
                ];
                $ranges['Semester 2 ' . $this->year] = [
                    'start' => Carbon::create($this->year, 7, 1)->startOfDay(),
                    'end' => Carbon::create($this->year, 12, 31)->endOfYear()
                ];
                break;
            case 'annual':
                $ranges['Tahun ' . $this->year] = [
                    'start' => Carbon::create($this->year, 1, 1)->startOfYear(),
                    'end' => Carbon::create($this->year, 12, 31)->endOfYear()
                ];
                break;
        }
        return $ranges;
    }
    private function getOperationsData(string $category, Carbon $startDate, Carbon $endDate): array
    {
        $query = ShipOperation::with(['ship.country', 'ship.shippingLine', 'cargoType'])
            ->where('user_id', Auth::id())
            ->whereHas('cargoType', function ($q) use ($category) {
                $q->where('category', $category);
            })
            ->whereBetween('operation_date', [$startDate, $endDate]);
        // Apply additional filters
        if (!empty($this->filters['cargo_category']) && $this->filters['cargo_category'] !== 'all') {
            $query->whereHas('cargoType', function ($q) {
                $q->where('category', $this->filters['cargo_category']);
            });
        }
        if (!empty($this->filters['shipping_line']) && $this->filters['shipping_line'] !== 'all') {
            $query->whereHas('ship.shippingLine', function ($q) {
                $q->where('id', $this->filters['shipping_line']);
            });
        }
        return $query->orderBy('operation_date', 'desc')
            ->get()
            ->map(function ($operation) {
                return [
                    'ship_name' => $operation->ship->name,
                    'shipping_line' => $operation->ship->shippingLine->name,
                    'country' => $operation->ship->country->name,
                    'cargo_name' => $operation->cargoType->name,
                    'unloading_tonnage' => $operation->unloading_tonnage,
                    'loading_tonnage' => $operation->loading_tonnage,
                ];
            })
            ->toArray();
    }
    private function getPeriodSummary(Carbon $startDate, Carbon $endDate): array
    {
        $operations = ShipOperation::with('cargoType')
            ->where('user_id', Auth::id())
            ->whereBetween('operation_date', [$startDate, $endDate])
            ->get();
        $gcOps = $operations->filter(function ($op) {
            return $op->cargoType->category === 'GC';
        });
        $containerOps = $operations->filter(function ($op) {
            return $op->cargoType->category === 'CONTAINER';
        });
        return [
            'total_unloading' => $operations->sum('unloading_tonnage'),
            'total_loading' => $operations->sum('loading_tonnage'),
            'gc_unloading' => $gcOps->sum('unloading_tonnage'),
            'gc_loading' => $gcOps->sum('loading_tonnage'),
            'container_unloading' => $containerOps->sum('unloading_tonnage'),
            'container_loading' => $containerOps->sum('loading_tonnage'),
        ];
    }
    private function getOverallSummary(): array
    {
        $startDate = Carbon::create($this->year, 1, 1)->startOfYear();
        $endDate = Carbon::create($this->year, 12, 31)->endOfYear();
        $operations = ShipOperation::with(['ship.shippingLine', 'cargoType'])
            ->where('user_id', Auth::id())
            ->whereBetween('operation_date', [$startDate, $endDate])
            ->get();
        // Separate GC and Container operations
        $gcOps = $operations->filter(function ($op) {
            return $op->cargoType->category === 'GC';
        });
        $containerOps = $operations->filter(function ($op) {
            return $op->cargoType->category === 'CONTAINER';
        });
        // Most productive ship
        $shipProductivity = $operations->groupBy('ship.name')
            ->map(function ($ops) {
                return $ops->sum('unloading_tonnage') + $ops->sum('loading_tonnage');
            })
            ->sortDesc();
        // Most handled cargo types
        $cargoUnloading = $operations->groupBy('cargoType.name')
            ->map(function ($ops) {
                return $ops->sum('unloading_tonnage');
            })
            ->sortDesc();
        $cargoLoading = $operations->groupBy('cargoType.name')
            ->map(function ($ops) {
                return $ops->sum('loading_tonnage');
            })
            ->sortDesc();
        // Most active shipping line
        $shippingLineActivity = $operations->groupBy('ship.shippingLine.name')
            ->map(function ($ops) {
                return $ops->count();
            })
            ->sortDesc();
        return [
            'total_ships' => $operations->unique('ship_id')->count(),
            'total_unloading' => $operations->sum('unloading_tonnage'),
            'total_loading' => $operations->sum('loading_tonnage'),
            'total_tonnage' => $operations->sum('unloading_tonnage') + $operations->sum('loading_tonnage'),
            'gc_total_unloading' => $gcOps->sum('unloading_tonnage'),
            'gc_total_loading' => $gcOps->sum('loading_tonnage'),
            'container_total_unloading' => $containerOps->sum('unloading_tonnage'),
            'container_total_loading' => $containerOps->sum('loading_tonnage'),
            'most_productive_ship' => $shipProductivity->keys()->first() ?? 'N/A',
            'most_unloaded_cargo' => $cargoUnloading->keys()->first() ?? 'N/A',
            'most_loaded_cargo' => $cargoLoading->keys()->first() ?? 'N/A',
            'most_active_line' => $shippingLineActivity->keys()->first() ?? 'N/A',
        ];
    }
    public function styles(Worksheet $sheet)
    {
        $styles = [];
        // Header utama - merge sampai kolom O
        $styles['A1:O1'] = [
            'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '1F4E79']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'D6E3F0']
            ]
        ];
        // Merge header cells sampai kolom O
        $sheet->mergeCells('A1:O1');
        // Header kategori (GC & CONTAINER)
        $styles['A3:G3'] = [
            'font' => ['bold' => true, 'size' => 12],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'E6E6FA']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        $styles['I3:O3'] = [
            'font' => ['bold' => true, 'size' => 12],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'E6E6FA']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];
        // Merge category headers
        $sheet->mergeCells('A3:G3');
        $sheet->mergeCells('I3:O3');
        // Header kolom
        $styles['A4:G4'] = [
            'font' => ['bold' => true],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'F0F8FF']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ];
        $styles['I4:O4'] = [
            'font' => ['bold' => true],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['rgb' => 'F0F8FF']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ];
        // Style untuk row bulan (highlight nama bulan)
        foreach ($this->monthRowPositions as $row) {
            // Merge cells untuk nama bulan
            $sheet->mergeCells("A{$row}:G{$row}"); // GC side
            $sheet->mergeCells("I{$row}:O{$row}"); // Container side
            $styles["A{$row}:G{$row}"] = [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E79']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFE6CC'] // Light orange
                ],
                'borders' => [
                    'outline' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            $styles["I{$row}:O{$row}"] = [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E79']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFE6CC'] // Light orange
                ],
                'borders' => [
                    'outline' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
        }
        // Style untuk row total - dengan highlight yang jelas
        foreach ($this->totalRowPositions as $row) {
            // GC Total
            $styles["A{$row}:G{$row}"] = [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '0F243E']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFFF99'] // Bright yellow highlight
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            // Right align total numbers
            $styles["F{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
            $styles["G{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];

            // Container Total
            $styles["I{$row}:O{$row}"] = [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '0F243E']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFFF99'] // Bright yellow highlight
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            // Right align container total numbers
            $styles["N{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
            $styles["O{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
        }
        // Apply borders to data ranges - no borders between GC and Container
        foreach ($this->dataRowRanges as $range) {
            for ($row = $range['start']; $row <= $range['end']; $row++) {
                // GC columns (A-G)
                $styles["A{$row}:G{$row}"] = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
                ];
                // Set right alignment for numeric columns
                $styles["F{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
                $styles["G{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];

                // Container columns (I-O) - skip column H
                $styles["I{$row}:O{$row}"] = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
                ];
                // Set right alignment for numeric columns in container section
                $styles["N{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
                $styles["O{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
            }
        }
        // Style untuk summary headers
        foreach ($this->summaryHeaderRows as $row) {
            if ($row == $this->summaryStartRow) {
                // Main summary header - merge A to O with enhanced visibility
                $sheet->mergeCells("A{$row}:O{$row}");
                $styles["A{$row}:O{$row}"] = [
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => '000000']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['rgb' => 'D6E3F0']
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => [
                        'outline' => [
                            'borderStyle' => Border::BORDER_THICK,
                        ],
                    ],
                ];
            } else {
                // Section headers - Statistics Umum and Analisis Kinerja
                $sheet->mergeCells("B{$row}:G{$row}"); // Statistik Umum (B-G)
                $sheet->mergeCells("J{$row}:O{$row}"); // Analisis Kinerja (J-O)

                $styles["B{$row}:G{$row}"] = [
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E79']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['rgb' => 'FFF2CC'] // Light yellow
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'borders' => [
                        'outline' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                        ],
                    ],
                ];

                $styles["J{$row}:O{$row}"] = [
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E79']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['rgb' => 'FFF2CC'] // Light yellow
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'borders' => [
                        'outline' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                        ],
                    ],
                ];
            }
        }
        // Style untuk summary content (only rows with actual data)
        if ($this->summaryStartRow > 0) {
            $summaryDataRows = [
                $this->summaryStartRow + 3, // Total Kapal Beroperasi
                $this->summaryStartRow + 4, // Total Tonnage Bongkar
                $this->summaryStartRow + 5, // Total
                $this->summaryStartRow + 6, // Total Tonnage Keseluruhan
                $this->summaryStartRow + 9, // GC - Total Bongkar
                $this->summaryStartRow + 10, // GC - Total Muat
                $this->summaryStartRow + 11, // Container - Total Bongkar
                $this->summaryStartRow + 12, // Container - Total Muat
            ];

            foreach ($summaryDataRows as $row) {
                // Statistik Umum (Left side B-G)
                $styles["B{$row}:G{$row}"] = [
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
                ];

                // Analisis Kinerja (Right side J-O)
                if ($row <= $this->summaryStartRow + 6) { // Only for first 4 rows
                    $styles["J{$row}:O{$row}"] = [
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                            ],
                        ],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT]
                    ];
                }
            }
        }

        return $styles;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 6,
            'B' => 25,
            'C' => 18,
            'D' => 12,
            'E' => 18,
            'F' => 12,
            'G' => 12,
            'H' => 3,
            'I' => 6,
            'J' => 25,
            'K' => 18,
            'L' => 12,
            'M' => 18,
            'N' => 12,
            'O' => 12,
        ];
    }

    public function title(): string
    {
        return "Produksi {$this->year}";
    }
}
