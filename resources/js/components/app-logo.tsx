import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md border border-blue-500 text-sidebar-primary-foreground">
                <AppLogoIcon width={60} height={60} className="text-blue-600" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">Shipment Apps</span>
            </div>
        </>
    );
}
