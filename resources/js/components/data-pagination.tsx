import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { router } from '@inertiajs/react';

interface PaginationProps {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    // Properties opsional dari Laravel pagination
    current_page?: number;
    last_page?: number;
    from?: number;
    to?: number;
    total?: number;
}

export function DataPagination({ links, current_page, last_page, from, to, total }: PaginationProps) {
    // Remove the first and last elements (previous/next) as we'll handle them separately
    const pageLinks = links.slice(1, -1);
    const previousLink = links[0];
    const nextLink = links[links.length - 1];

    // Fallback jika data pagination tidak tersedia
    const currentPage = current_page || pageLinks.find((link) => link.active)?.label || 1;
    const totalPages = last_page || pageLinks.length;

    return (
        <div className="mt-2 space-y-4">
            {/* Info text - visible on all screens */}
            <div className="text-center text-sm text-muted-foreground sm:text-left">
                {from && to && total ? (
                    <span className="block sm:inline">
                        Showing {from} to {to} of {total} results
                        <span className="block sm:ml-1 sm:inline">
                            (Page {currentPage} of {totalPages})
                        </span>
                    </span>
                ) : (
                    `Showing page ${currentPage} of ${totalPages}`
                )}
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center">
                <Pagination className="mx-0 w-auto">
                    <PaginationContent className="flex-wrap gap-1">
                        {/* Previous Page Link */}
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (previousLink.url) router.get(previousLink.url);
                                }}
                                isActive={!!previousLink.url}
                                className="h-8 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm"
                            />
                        </PaginationItem>

                        {/* Page Number Links - responsive display */}
                        {pageLinks.map((link, index) => {
                            // On mobile, show only current page and adjacent pages
                            const isCurrentPage = link.active;
                            const linkNumber = parseInt(link.label);
                            const currentPageNumber = parseInt(pageLinks.find((l) => l.active)?.label || '1');

                            // Show logic for mobile
                            const showOnMobile =
                                isCurrentPage ||
                                Math.abs(linkNumber - currentPageNumber) <= 1 ||
                                linkNumber === 1 ||
                                linkNumber === totalPages ||
                                link.label === '...';

                            return (
                                <PaginationItem key={index} className={`${showOnMobile ? 'block' : 'hidden'} sm:block`}>
                                    <PaginationLink
                                        href="#"
                                        isActive={link.active}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (link.url) router.get(link.url);
                                        }}
                                        className="h-8 w-8 text-xs sm:h-10 sm:w-10 sm:text-sm"
                                    >
                                        {link.label}
                                    </PaginationLink>
                                </PaginationItem>
                            );
                        })}

                        {/* Next Page Link */}
                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (nextLink.url) router.get(nextLink.url);
                                }}
                                isActive={!!nextLink.url}
                                className="h-8 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm"
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Mobile: Compact page info */}
            <div className="block text-center sm:hidden">
                <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                </div>
            </div>
        </div>
    );
}
