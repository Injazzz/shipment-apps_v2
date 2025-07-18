<?php
namespace App\Exports;

use App\Models\ShipOperation;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
// use Maatwebsite\Excel\Concerns\WithCharts;
use Maatwebsite\Excel\Concerns\WithDrawings;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Chart\Chart;
use PhpOffice\PhpSpreadsheet\Chart\DataSeries;
use PhpOffice\PhpSpreadsheet\Chart\DataSeriesValues;
use PhpOffice\PhpSpreadsheet\Chart\Legend;
use PhpOffice\PhpSpreadsheet\Chart\PlotArea;
use PhpOffice\PhpSpreadsheet\Chart\Title;
use PhpOffice\PhpSpreadsheet\Chart\Layout;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ShipOperationMainSheet implements FromArray, WithStyles, WithTitle, WithColumnWidths
{
    protected $filters;
    protected $period;
    protected $year;
    protected $isSummary;
    protected $monthRowPositions = [];
    protected $totalRowPositions = [];
    protected $dataRowRanges = [];
    protected $chartDataRange = [];
    protected $chartStartRow = 0;
    protected $yearlySummaries = [];

    public function __construct(array $filters, string $period, $year, bool $isSummary)
    {
        $this->filters = $filters;
        $this->period = $period;
        $this->year = $year;
        $this->isSummary = $isSummary;
    }

    public function array(): array
    {
        if ($this->isSummary) {
            return $this->buildSummaryData();
        }
        return $this->buildYearlyData();
    }

    protected function buildYearlyData(): array
    {
        $data = [];
        $currentRow = 1;
        $periodRanges = $this->getPeriodRanges();

        // Header utama
        $data[] = ["DATA PRODUKSI TAHUN {$this->year} IKPP MERAK", '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow += 2;

        // Header kategori
        $data[] = ['GC', '', '', '', '', '', '', '', 'CONTAINER', '', '', '', '', '', ''];
        $currentRow++;

        // Header kolom
        $data[] = [
            'NO', 'NAMA KAPAL', 'LINE', 'BENDERA', 'CARGO', 'T/BONGKAR', 'T/MUAT', '',
            'NO', 'NAMA KAPAL', 'LINE', 'BENDERA', 'CARGO', 'T/BONGKAR', 'T/MUAT'
        ];
        $currentRow++;

        foreach ($periodRanges as $periodName => $dateRange) {
            $gcData = $this->getOperationsData('GC', $dateRange['start'], $dateRange['end']);
            $containerData = $this->getOperationsData('CONTAINER', $dateRange['start'], $dateRange['end']);

            if (empty($gcData)) {
                $gcData = [['ship_name' => '', 'shipping_line' => '', 'country' => '', 'cargo_name' => '', 'unloading_tonnage' => 0, 'loading_tonnage' => 0]];
            }

            if (empty($containerData)) {
                $containerData = [['ship_name' => '', 'shipping_line' => '', 'country' => '', 'cargo_name' => '', 'unloading_tonnage' => 0, 'loading_tonnage' => 0]];
            }

            $periodSummary = $this->getPeriodSummary($dateRange['start'], $dateRange['end']);

            $data[] = [$periodName, '', '', '', '', '', '', '', $periodName, '', '', '', '', '', ''];
            $this->monthRowPositions[] = $currentRow;
            $currentRow++;

            $dataStartRow = $currentRow;
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
            $gcCount = count(array_filter($gcData, function($item) {
                return !empty($item['ship_name']);
            }));

            $containerCount = count(array_filter($containerData, function($item) {
                return !empty($item['ship_name']);
            }));

            $data[] = [
                'TOTAL', '', $gcCount, '', '',
                $periodSummary['gc_unloading'] > 0 ? number_format($periodSummary['gc_unloading'], 2, ',', '.') : '',
                $periodSummary['gc_loading'] > 0 ? number_format($periodSummary['gc_loading'], 2, ',', '.') : '',
                '',
                'TOTAL', '', $containerCount, '', '',
                $periodSummary['container_unloading'] > 0 ? number_format($periodSummary['container_unloading'], 2, ',', '.') : '',
                $periodSummary['container_loading'] > 0 ? number_format($periodSummary['container_loading'], 2, ',', '.') : ''
            ];
            $this->totalRowPositions[] = $currentRow;
            $currentRow++;

            if ($maxRows > 0) {
                $this->dataRowRanges[] = [
                    'start' => $dataStartRow,
                    'end' => $currentRow - 1
                ];
            }

            $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            $currentRow++;
        }

        return $data;
    }

    protected function buildSummaryData(): array
    {
        $years = explode(',', $this->year);
        $data = [];
        $currentRow = 1;

        // Header utama
        $data[] = ["RINGKASAN PRODUKSI TAHUN " . implode(', ', $years), '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        // Data per tahun
        $data[] = ['PERBANDINGAN PER TAHUN', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        foreach ($years as $year) {
            $this->yearlySummaries[$year] = $this->getYearlySummary($year);
        }

        // Header tabel perbandingan
        $data[] = ['Tahun', 'Total Kapal', 'Total Bongkar', 'Total Muat', 'Total Keseluruhan', '', '', '', '', '', '', '', '', '', ''];
        $this->chartStartRow = $currentRow;
        $currentRow++;

        // Isi tabel perbandingan
        foreach ($this->yearlySummaries as $year => $summary) {
            $data[] = [
                $year,
                $summary['total_ships'],
                $summary['total_unloading'] > 0 ? number_format($summary['total_unloading'], 2, ',', '.') : '0',
                $summary['total_loading'] > 0 ? number_format($summary['total_loading'], 2, ',', '.') : '0',
                ($summary['total_unloading'] + $summary['total_loading']) > 0 ?
                    number_format($summary['total_unloading'] + $summary['total_loading'], 2, ',', '.') : '0',
                '', '', '', '', '', '', '', '', '', ''
            ];
            $currentRow++;
        }

        // Pastikan end row mencakup semua data
        $this->chartDataRange = [
            'start' => $this->chartStartRow + 1,
            'end' => $currentRow - 1, // Gunakan currentRow terakhir
            'years_count' => count($years)
        ];

        \Log::info('Chart data range set:', $this->chartDataRange);

        // Trend pertumbuhan dengan data untuk chart
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['TREND PERTUMBUHAN', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        // Data trend bulanan (untuk chart yang lebih detail)
        $monthlyTrend = $this->getMonthlyTrendData($years);
        $data[] = ['Bulan', 'Bongkar', 'Muat', 'Total', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        foreach ($monthlyTrend as $month => $trend) {
            $data[] = [
                $month,
                $trend['unloading'] > 0 ? number_format($trend['unloading'], 2, ',', '.') : '0',
                $trend['loading'] > 0 ? number_format($trend['loading'], 2, ',', '.') : '0',
                ($trend['unloading'] + $trend['loading']) > 0 ?
                    number_format($trend['unloading'] + $trend['loading'], 2, ',', '.') : '0',
                '', '', '', '', '', '', '', '', '', ''
            ];
            $currentRow++;
        }

        // Analisis multi-tahun
        $multiYearAnalysis = $this->getMultiYearAnalysis($this->yearlySummaries);
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['ANALISIS MULTI-TAHUN', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        $data[] = [
            'Rata-rata Kapal/Tahun:', $multiYearAnalysis['average_ships'],
            '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;

        $data[] = [
            'Rata-rata Bongkar/Tahun:', number_format($multiYearAnalysis['average_unloading'], 2, ',', '.'),
            '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;

        $data[] = [
            'Pertumbuhan Tahunan:', $multiYearAnalysis['growth_rate'] . '%',
            '', '', '', '', '', '', '', '', '', '', '', '', ''
        ];
        $currentRow++;

        // Performance indicators
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['INDIKATOR KINERJA', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;

        $performanceData = $this->getPerformanceIndicators($this->yearlySummaries);
        foreach ($performanceData as $indicator => $value) {
            $data[] = [
                $indicator . ':', $value,
                '', '', '', '', '', '', '', '', '', '', '', '', ''
            ];
            $currentRow++;
        }

        // Signature section
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', 'Merak, ' . now()->translatedFormat('d F Y'), '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', 'Penanggung Jawab,', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
        $currentRow++;
        $data[] = ['', '', '', '', '', '', '', '', '', '', '', '', '(_________________)', '', ''];
        $currentRow++;

        return $data;
    }

    public function charts(): array
    {
        // Pastikan hanya membuat chart di mode summary
        if (!$this->isSummary) {
            \Log::info('Charts disabled for non-summary view');
            return [];
        }

        // Pastikan data range valid
        if (empty($this->chartDataRange)) {
            \Log::error('Empty chart data range');
            return [];
        }

        // Pastikan ada cukup data
        if ($this->chartDataRange['end'] - $this->chartDataRange['start'] < 1) {
            \Log::warning('Insufficient data for charts', $this->chartDataRange);
            return [];
        }

        $charts = [];

        // Buat yearly chart hanya jika ada cukup tahun
        if ($this->chartDataRange['years_count'] >= 1) {
            $yearlyChart = $this->createYearlyComparisonChart();
            if ($yearlyChart) {
                $charts[] = $yearlyChart;
            }
        }

        // Buat monthly chart
        $monthlyChart = $this->createMonthlyTrendChart();
        if ($monthlyChart) {
            $charts[] = $monthlyChart;
        }

        return $charts;
    }

    // protected function createYearlyComparisonChart(): ?Chart
    // {
    //     // Validasi data range
    //     if (empty($this->chartDataRange)) {
    //         \Log::error('Yearly chart: Empty chartDataRange');
    //         return null;
    //     }

    //     $startRow = $this->chartDataRange['start'];
    //     $endRow = $this->chartDataRange['end'];

    //     \Log::info('Creating yearly chart', [
    //         'startRow' => $startRow,
    //         'endRow' => $endRow,
    //         'years_count' => $this->chartDataRange['years_count']
    //     ]);

    //     try {
    //         // Data series values harus mengacu ke cell yang benar
    //         $dataSeriesLabels = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$B$' . ($this->chartStartRow), null, 1),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$C$' . ($this->chartStartRow), null, 1),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$D$' . ($this->chartStartRow), null, 1),
    //         ];

    //         $xAxisTickValues = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$A$' . $startRow . ':$A$' . $endRow, null, $this->chartDataRange['years_count']),
    //         ];

    //         $dataSeriesValues = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, 'Worksheet!$B$' . $startRow . ':$B$' . $endRow, null, $this->chartDataRange['years_count']),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, 'Worksheet!$C$' . $startRow . ':$C$' . $endRow, null, $this->chartDataRange['years_count']),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, 'Worksheet!$D$' . $startRow . ':$D$' . $endRow, null, $this->chartDataRange['years_count']),
    //         ];

    //         $series = new DataSeries(
    //             DataSeries::TYPE_BARCHART,
    //             DataSeries::GROUPING_CLUSTERED,
    //             range(0, count($dataSeriesValues) - 1),
    //             $dataSeriesLabels,
    //             $xAxisTickValues,
    //             $dataSeriesValues
    //         );

    //         $plotArea = new PlotArea(null, [$series]);
    //         $legend = new Legend(Legend::POSITION_RIGHT, null, false);
    //         $title = new Title('Perbandingan Produksi Tahunan');

    //         $chart = new Chart(
    //             'yearly_comparison',
    //             $title,
    //             $legend,
    //             $plotArea,
    //             true,
    //             0,
    //             null,
    //             null
    //         );

    //         // Posisikan chart di area yang benar
    //         $chart->setTopLeftPosition('G4');
    //         $chart->setBottomRightPosition('O20');

    //         return $chart;

    //     } catch (\Exception $e) {
    //         \Log::error('Error creating yearly chart: ' . $e->getMessage());
    //         return null;
    //     }
    // }

    // protected function createMonthlyTrendChart(): ?Chart
    // {
    //     if (empty($this->chartDataRange)) {
    //         \Log::error('Monthly chart: Empty chartDataRange');
    //         return null;
    //     }

    //     // Hitung posisi data bulanan
    //     $monthlyStartRow = $this->chartStartRow + $this->chartDataRange['years_count'] + 5;
    //     $monthlyEndRow = $monthlyStartRow + 11; // 12 bulan


    //     if ($monthlyEndRow - $monthlyStartRow < 1) {
    //         \Log::warning('Insufficient monthly data', [
    //             'start' => $monthlyStartRow,
    //             'end' => $monthlyEndRow
    //         ]);
    //         return null;
    //     }

    //     \Log::info('Creating monthly chart', [
    //         'monthlyStartRow' => $monthlyStartRow,
    //         'monthlyEndRow' => $monthlyEndRow
    //     ]);

    //     try {
    //         $dataSeriesLabels = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$B$' . ($monthlyStartRow - 1), null, 1),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$C$' . ($monthlyStartRow - 1), null, 1),
    //         ];

    //         $xAxisTickValues = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_STRING, 'Worksheet!$A$' . $monthlyStartRow . ':$A$' . $monthlyEndRow, null, 12),
    //         ];

    //         $dataSeriesValues = [
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, 'Worksheet!$B$' . $monthlyStartRow . ':$B$' . $monthlyEndRow, null, 12),
    //             new DataSeriesValues(DataSeriesValues::DATASERIES_TYPE_NUMBER, 'Worksheet!$C$' . $monthlyStartRow . ':$C$' . $monthlyEndRow, null, 12),
    //         ];

    //         $series = new DataSeries(
    //             DataSeries::TYPE_LINECHART,
    //             DataSeries::GROUPING_STANDARD,
    //             range(0, count($dataSeriesValues) - 1),
    //             $dataSeriesLabels,
    //             $xAxisTickValues,
    //             $dataSeriesValues
    //         );

    //         $plotArea = new PlotArea(null, [$series]);
    //         $legend = new Legend(Legend::POSITION_RIGHT, null, false);
    //         $title = new Title('Trend Bulanan (Rata-rata)');

    //         $chart = new Chart(
    //             'monthly_trend',
    //             $title,
    //             $legend,
    //             $plotArea,
    //             true,
    //             0,
    //             null,
    //             null
    //         );

    //         // Posisikan chart di bawah tabel monthly trend
    //         $chart->setTopLeftPosition('G' . ($monthlyStartRow + 2));
    //         $chart->setBottomRightPosition('O' . ($monthlyStartRow + 15));

    //         return $chart;

    //     } catch (\Exception $e) {
    //         \Log::error('Error creating monthly chart: ' . $e->getMessage());
    //         return null;
    //     }
    // }

    protected function getMonthlyTrendData(array $years): array
    {
        $monthlyData = [];
        $months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        foreach ($months as $monthIndex => $monthName) {
            $totalUnloading = 0;
            $totalLoading = 0;

            foreach ($years as $year) {
                $startDate = Carbon::create($year, $monthIndex + 1, 1)->startOfMonth();
                $endDate = Carbon::create($year, $monthIndex + 1, 1)->endOfMonth();

                $operations = ShipOperation::where('user_id', Auth::id())
                    ->whereBetween('operation_date', [$startDate, $endDate])
                    ->get();

                $totalUnloading += $operations->sum('unloading_tonnage');
                $totalLoading += $operations->sum('loading_tonnage');
            }

            $monthlyData[$monthName] = [
                'unloading' => $totalUnloading / count($years), // Average across years
                'loading' => $totalLoading / count($years),
                'total' => ($totalUnloading + $totalLoading) / count($years)
            ];
        }

        return $monthlyData;
    }

    protected function getPerformanceIndicators(array $yearlySummaries): array
    {
        $years = array_keys($yearlySummaries);
        $totalYears = count($years);

        if ($totalYears < 2) {
            return [
                'Efisiensi Operasional' => 'N/A',
                'Tingkat Utilisasi' => 'N/A',
                'Konsistensi Produksi' => 'N/A'
            ];
        }

        // Calculate performance metrics
        $totalTonnages = array_column($yearlySummaries, 'total_tonnage');
        $totalShips = array_column($yearlySummaries, 'total_ships');

        $avgTonnagePerShip = array_sum($totalTonnages) / array_sum($totalShips);
        $stdDeviation = $this->calculateStandardDeviation($totalTonnages);
        $coefficient = $stdDeviation / (array_sum($totalTonnages) / $totalYears);

        return [
            'Efisiensi Operasional' => number_format($avgTonnagePerShip, 2, ',', '.') . ' ton/kapal',
            'Tingkat Utilisasi' => number_format((array_sum($totalTonnages) / ($totalYears * 1000000)) * 100, 2) . '%',
            'Konsistensi Produksi' => $coefficient < 0.2 ? 'Tinggi' : ($coefficient < 0.5 ? 'Sedang' : 'Rendah')
        ];
    }

    protected function calculateStandardDeviation(array $values): float
    {
        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(function($x) use ($mean) {
            return pow($x - $mean, 2);
        }, $values)) / count($values);

        return sqrt($variance);
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
        $sheet->mergeCells('A1:O1');

        if ($this->isSummary) {
            // Summary specific styles
            $styles['A3:O3'] = [
                'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1F4E79']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'E6F3FF']
                ]
            ];
            $sheet->mergeCells('A3:O3');

            // Table headers
            if ($this->chartStartRow > 0) {
                $headerRow = $this->chartStartRow;
                $styles["A{$headerRow}:E{$headerRow}"] = [
                    'font' => ['bold' => true, 'size' => 12],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'color' => ['rgb' => 'F0F8FF']
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
                ];

                // Data rows styling
                for ($row = $headerRow + 1; $row <= $headerRow + $this->chartDataRange['years_count']; $row++) {
                    $styles["A{$row}:E{$row}"] = [
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                            ],
                        ],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
                    ];
                    // Right align numeric columns
                    $styles["B{$row}:E{$row}"] = [
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT],
                        'numberFormat' => ['formatCode' => '#,##0.00']
                    ];
                }
            }

            // Section headers styling
            $this->applySectionHeaderStyles($sheet, $styles);
        } else {
            // Yearly data specific styles
            $this->applyYearlyDataStyles($sheet, $styles);
        }

        return $styles;
    }

    protected function applySectionHeaderStyles(Worksheet $sheet, array &$styles)
    {
        // Find section headers and apply styles
        $sectionHeaders = ['TREND PERTUMBUHAN', 'ANALISIS MULTI-TAHUN', 'INDIKATOR KINERJA'];

        foreach ($sectionHeaders as $header) {
            // You would need to track the row positions of these headers
            // For simplicity, applying a general style pattern
        }
    }

    protected function applyYearlyDataStyles(Worksheet $sheet, array &$styles)
    {
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

        // Apply styles for month and total rows
        $this->applyMonthAndTotalRowStyles($sheet, $styles);
        $this->applyDataRowStyles($sheet, $styles);
    }

    protected function applyMonthAndTotalRowStyles(Worksheet $sheet, array &$styles)
    {
        // Style untuk row bulan
        foreach ($this->monthRowPositions as $row) {
            $sheet->mergeCells("A{$row}:G{$row}");
            $sheet->mergeCells("I{$row}:O{$row}");
            $styles["A{$row}:G{$row}"] = [
                'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '1F4E79']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFE6CC']
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
                    'color' => ['rgb' => 'FFE6CC']
                ],
                'borders' => [
                    'outline' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
        }

        // Style untuk row total
        foreach ($this->totalRowPositions as $row) {
            $styles["A{$row}:G{$row}"] = [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '0F243E']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFFF99']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            $styles["F{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
            $styles["G{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];

            $styles["I{$row}:O{$row}"] = [
                'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '0F243E']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'color' => ['rgb' => 'FFFF99']
                ],
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_MEDIUM,
                    ],
                ],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
            ];
            $styles["N{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
            $styles["O{$row}"] = ['alignment' => ['horizontal' => Alignment::HORIZONTAL_RIGHT]];
        }
    }

    protected function applyDataRowStyles(Worksheet $sheet, array &$styles)
    {
        // Apply borders to data ranges
        foreach ($this->dataRowRanges as $range) {
            for ($row = $range['start']; $row <= $range['end']; $row++) {
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
        if ($this->isSummary) {
            return 'Ringkasan Multi-Tahun';
        }
        return "Produksi {$this->year}";
    }

    protected function getYearlySummary($year): array
    {
        $startDate = Carbon::create($year, 1, 1)->startOfYear();
        $endDate = Carbon::create($year, 12, 31)->endOfYear();

        $operations = ShipOperation::with(['ship.shippingLine', 'cargoType'])
            ->where('user_id', Auth::id())
            ->whereBetween('operation_date', [$startDate, $endDate])
            ->get();

        $gcOps = $operations->filter(fn($op) => $op->cargoType->category === 'GC');
        $containerOps = $operations->filter(fn($op) => $op->cargoType->category === 'CONTAINER');

        return [
            'total_ships' => $operations->unique('ship_id')->count(),
            'total_unloading' => $operations->sum('unloading_tonnage'),
            'total_loading' => $operations->sum('loading_tonnage'),
            'total_tonnage' => $operations->sum('unloading_tonnage') + $operations->sum('loading_tonnage'),
            'gc_total_unloading' => $gcOps->sum('unloading_tonnage'),
            'gc_total_loading' => $gcOps->sum('loading_tonnage'),
            'container_total_unloading' => $containerOps->sum('unloading_tonnage'),
            'container_total_loading' => $containerOps->sum('loading_tonnage')
        ];
    }

    protected function getMultiYearAnalysis(array $yearlySummaries): array
    {
        $years = array_keys($yearlySummaries);
        $count = count($years);

        $totalShips = array_sum(array_column($yearlySummaries, 'total_ships'));
        $totalUnloading = array_sum(array_column($yearlySummaries, 'total_unloading'));
        $totalLoading = array_sum(array_column($yearlySummaries, 'total_loading'));
        $totalTonnage = array_sum(array_column($yearlySummaries, 'total_tonnage'));

        // Hitung pertumbuhan tahunan jika ada lebih dari 1 tahun
        $growthRate = 0;
        if ($count > 1) {
            $firstYear = reset($yearlySummaries);
            $lastYear = end($yearlySummaries);
            $growthRate = round((($lastYear['total_tonnage'] - $firstYear['total_tonnage']) / $firstYear['total_tonnage']) * 100, 2);
        }

        return [
            'average_ships' => round($totalShips / $count),
            'average_unloading' => $totalUnloading / $count,
            'average_loading' => $totalLoading / $count,
            'average_tonnage' => $totalTonnage / $count,
            'growth_rate' => $growthRate
        ];
    }

    protected function getPeriodRanges(): array
    {
        $ranges = [];
        $year = is_numeric($this->year) ? $this->year : Carbon::now()->year;

        switch ($this->period) {
            case 'monthly':
                for ($month = 1; $month <= 12; $month++) {
                    $monthName = Carbon::create($year, $month, 1)->translatedFormat('F Y');
                    $ranges[$monthName] = [
                        'start' => Carbon::create($year, $month, 1)->startOfMonth(),
                        'end' => Carbon::create($year, $month, 1)->endOfMonth()
                    ];
                }
                break;
            case 'quarterly':
                $quarters = [
                    'Q1 ' . $year => ['start' => 1, 'end' => 3],
                    'Q2 ' . $year => ['start' => 4, 'end' => 6],
                    'Q3 ' . $year => ['start' => 7, 'end' => 9],
                    'Q4 ' . $year => ['start' => 10, 'end' => 12],
                ];
                foreach ($quarters as $quarterName => $months) {
                    $ranges[$quarterName] = [
                        'start' => Carbon::create($year, $months['start'], 1)->startOfMonth(),
                        'end' => Carbon::create($year, $months['end'], 1)->endOfMonth()
                    ];
                }
                break;
            case 'semi-annual':
                $ranges['Semester 1 ' . $year] = [
                    'start' => Carbon::create($year, 1, 1)->startOfYear(),
                    'end' => Carbon::create($year, 6, 30)->endOfDay()
                ];
                $ranges['Semester 2 ' . $year] = [
                    'start' => Carbon::create($year, 7, 1)->startOfDay(),
                    'end' => Carbon::create($year, 12, 31)->endOfYear()
                ];
                break;
            case 'annual':
                $ranges['Tahun ' . $year] = [
                    'start' => Carbon::create($year, 1, 1)->startOfYear(),
                    'end' => Carbon::create($year, 12, 31)->endOfYear()
                ];
                break;
        }
        return $ranges;
    }

    protected function getOperationsData(string $category, Carbon $startDate, Carbon $endDate): array
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

    protected function getPeriodSummary(Carbon $startDate, Carbon $endDate): array
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
}

