import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Package, Shield, Ship, TowerControl, Users } from 'lucide-react';
import AppLogo from './app-logo';

// User navigation items
const userNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('user.dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Data Kapal',
        href: route('user.ships.index'),
        icon: Ship,
    },
    {
        title: 'Data Produksi',
        href: route('user.ship-operations.index'),
        icon: Package,
    },
    {
        title: 'Laporan dan Analisa',
        href: route('user.ship-operations.analytics.index'),
        icon: TowerControl,
    },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard Admin',
        href: route('admin.dashboard'),
        icon: Shield,
    },
    {
        title: 'Manajemen Pengguna',
        href: route('admin.users.index'),
        icon: Users,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    // Determine navigation items and dashboard route based on user role
    const isAdmin = user?.role === 'admin';
    const navItems = isAdmin ? adminNavItems : userNavItems;
    const dashboardRoute = isAdmin ? route('admin.dashboard') : route('user.dashboard');

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardRoute} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
