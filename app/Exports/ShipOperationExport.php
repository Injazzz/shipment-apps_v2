<?php
namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Carbon\Carbon;

class ShipOperationExport implements WithMultipleSheets
{
    protected $filters;
    protected $period;
    protected $years;

    public function __construct(array $filters, string $period, array $years)
    {
        $this->filters = $filters;
        $this->period = $period;
        $this->years = $years;
    }

    public function sheets(): array
    {
        $sheets = [];

        // Sheet untuk setiap tahun
        foreach ($this->years as $year) {
            $sheets[] = new ShipOperationMainSheet(
                $this->filters,
                $this->period,
                $year,
                false // bukan ringkasan
            );
        }

        // Sheet ringkasan di akhir (hanya jika multi-tahun)
        if (count($this->years) > 1) {
            $sheets[] = new ShipOperationMainSheet(
                $this->filters,
                'annual', // ringkasan selalu tampilkan annual
                implode(',', $this->years),
                true // flag ringkasan
            );
        }

        return $sheets;
    }
}
