/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PageProps {
    props: {
        summary: any;
        trends: any[];
        cargoComparison: any[];
        topShips: any[];
        monthlyOperations: any[];
    };
    version: string;
    url: string;
    component: string;
}
