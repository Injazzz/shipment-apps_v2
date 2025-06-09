import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Anchor, ArrowRight, CheckCircle, Mail, MapPin, Phone, TrendingUp } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="mt-5 flex w-full justify-center">
                <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                                    <AppLogoIcon width={60} height={60} className="text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">IKKP Merak</h1>
                                    <p className="text-xs text-slate-600">Port Management System</p>
                                </div>
                            </div>
                            <nav className="hidden items-center space-x-8 md:flex">
                                <Link href="#features" className="text-slate-600 transition-colors hover:text-blue-600">
                                    Fitur
                                </Link>
                                <Link href="#about" className="text-slate-600 transition-colors hover:text-blue-600">
                                    Tentang
                                </Link>
                                <Link href="#contact" className="text-slate-600 transition-colors hover:text-blue-600">
                                    Kontak
                                </Link>
                                {auth.user ? (
                                    <Link
                                        href={`${auth.user.role === 'user' ? route('user.dashboard') : route('admin.dashboard')}`}
                                        className="inline-block rounded-sm text-black border border-[#19140035] px-5 py-1.5 text-sm leading-normal shadow-sm hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b]"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="inline-block text-black rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal shadow-sm hover:border-[#19140035] dark:hover:border-[#3E3E3A]"
                                        >
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>
            </div>

            {/* Hero Section */}
            <section className="bg-white pt-24 pb-16 lg:pt-32 lg:pb-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    <Anchor className="mr-2 h-4 w-4" />
                                    Sistem Terdepan Indonesia
                                </Badge>
                                <h1 className="text-4xl leading-tight font-bold text-slate-900 lg:text-6xl">
                                    Sistem Pendataan
                                    <span className="block text-blue-600">Kapal Bongkar Muat</span>
                                    Pelabuhan IKKP Merak
                                </h1>
                                <p className="text-xl leading-relaxed text-slate-600">
                                    Solusi digital terdepan untuk mengelola aktivitas bongkar muat kapal dengan efisiensi tinggi, transparansi penuh,
                                    dan keamanan data terjamin di Pelabuhan IKKP Merak.
                                </p>
                            </div>
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Button size="lg" className="bg-blue-600 px-8 py-3 text-lg hover:bg-blue-700">
                                    Mulai Sekarang
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                                    Pelajari Lebih Lanjut
                                </Button>
                            </div>
                            <div className="flex items-center space-x-8 pt-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900">500+</div>
                                    <div className="text-sm text-slate-600">Kapal Terdaftar</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900">24/7</div>
                                    <div className="text-sm text-slate-600">Monitoring</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-slate-900">99.9%</div>
                                    <div className="text-sm text-slate-600">Uptime</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="relative z-10">
                                <img
                                    src="/images/bg-2.jpg"
                                    alt="Pelabuhan IKKP Merak dengan kapal-kapal besar sedang melakukan aktivitas bongkar muat"
                                    width={800}
                                    height={600}
                                    className="rounded-2xl shadow-2xl"
                                />
                                <div className="absolute -bottom-6 -left-6 rounded-xl border-0 bg-white p-6 shadow-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                            <TrendingUp className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900">Efisiensi Meningkat</div>
                                            <div className="text-sm text-slate-600">+45% lebih cepat</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* <div className="absolute top-4 right-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white">Live Monitoring</div> */}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            {/* <section id="features" className="bg-slate-50 py-16 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-16 space-y-4 text-center">
                        <Badge className="bg-blue-100 text-blue-800">Fitur Unggulan</Badge>
                        <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Mengapa Memilih Sistem Kami?</h2>
                        <p className="mx-auto max-w-3xl text-xl text-slate-600">
                            Sistem terintegrasi yang dirancang khusus untuk memenuhi kebutuhan operasional pelabuhan modern dengan teknologi terdepan.
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                    <BarChart3 className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Real-time Analytics</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Pantau aktivitas bongkar muat secara real-time dengan dashboard interaktif dan laporan komprehensif untuk
                                    pengambilan keputusan yang tepat.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                    <Shield className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Keamanan Terjamin</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Sistem keamanan berlapis dengan enkripsi end-to-end, backup otomatis, dan kontrol akses berbasis peran untuk
                                    melindungi data sensitif.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                    <Clock className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Efisiensi Waktu</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Otomatisasi proses dokumentasi dan pelaporan yang mengurangi waktu administrasi hingga 60% dan meminimalkan
                                    kesalahan manual.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                                    <Users className="h-6 w-6 text-orange-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Multi-User Access</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Akses simultan untuk berbagai stakeholder dengan kontrol permission yang fleksibel sesuai dengan peran dan
                                    tanggung jawab masing-masing.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                                    <MapPin className="h-6 w-6 text-red-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Tracking Lokasi</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Pelacakan posisi kapal dan kargo secara akurat dengan integrasi GPS dan sistem navigasi untuk optimalisasi
                                    operasional pelabuhan.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
                            <CardContent className="p-8">
                                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                                    <CheckCircle className="h-6 w-6 text-teal-600" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-slate-900">Compliance Ready</h3>
                                <p className="leading-relaxed text-slate-600">
                                    Memenuhi standar regulasi nasional dan internasional dengan dokumentasi lengkap dan audit trail untuk keperluan
                                    compliance.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section> */}

            {/* About Section */}
            <section id="about" className="bg-white py-16 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        <div className="relative">
                            <img
                                src="/images/bg-1.jpg"
                                alt="Pemandangan udara Pelabuhan IKKP Merak dengan dermaga modern dan kapal-kapal besar"
                                width={600}
                                height={500}
                                className="h-[500px] w-full rounded-2xl object-cover object-center shadow-xl"
                            />
                            <div className="absolute -top-4 -right-4 rounded-xl bg-white p-4 shadow-lg">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">15+</div>
                                    <div className="text-sm text-slate-600">Tahun Beroperasi</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <Badge className="bg-slate-100 text-slate-800">Tentang IKKP Merak</Badge>
                                <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Pelabuhan Strategis di Selat Sunda</h2>
                                <p className="text-lg leading-relaxed text-slate-600">
                                    Pelabuhan IKKP Merak merupakan gerbang utama penghubung Pulau Jawa dan Sumatera, melayani ribuan kapal setiap
                                    bulannya dengan kapasitas bongkar muat yang terus berkembang.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Lokasi Strategis</h4>
                                        <p className="text-slate-600">Posisi ideal di Selat Sunda untuk konektivitas antar pulau</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Fasilitas Modern</h4>
                                        <p className="text-slate-600">Dermaga dan peralatan bongkar muat berstandar internasional</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
                                    <div>
                                        <h4 className="font-semibold text-slate-900">Operasional 24/7</h4>
                                        <p className="text-slate-600">Layanan non-stop untuk mendukung kelancaran logistik nasional</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-blue-600 py-16 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8 text-center">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-white lg:text-4xl">Siap Meningkatkan Efisiensi Pelabuhan Anda?</h2>
                            <p className="mx-auto max-w-2xl text-xl text-blue-100">
                                Bergabunglah dengan sistem pendataan kapal terdepan dan rasakan perbedaan dalam operasional pelabuhan Anda.
                            </p>
                        </div>
                        <div className="flex flex-col justify-center gap-4 sm:flex-row">
                            <Button size="lg" className="bg-white px-8 py-3 text-lg text-blue-600 hover:bg-slate-50">
                                Mulai Uji Coba Gratis
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-white px-8 py-3 text-lg text-white hover:bg-white hover:text-blue-600"
                            >
                                Hubungi Tim Kami
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="bg-slate-50 py-16 lg:py-24">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 space-y-4 text-center">
                        <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Hubungi Kami</h2>
                        <p className="text-xl text-slate-600">Tim ahli kami siap membantu Anda 24/7</p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        <Card className="border-0 bg-white text-center shadow-lg">
                            <CardContent className="p-8">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                                    <Phone className="h-6 w-6 text-blue-600" />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Telepon</h3>
                                <p className="text-slate-600">+62 254 123 4567</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-white text-center shadow-lg">
                            <CardContent className="p-8">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                                    <Mail className="h-6 w-6 text-green-600" />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Email</h3>
                                <p className="text-slate-600">info@ikkpmerak.co.id</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-white text-center shadow-lg">
                            <CardContent className="p-8">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                                    <MapPin className="h-6 w-6 text-purple-600" />
                                </div>
                                <h3 className="mb-2 font-semibold text-slate-900">Alamat</h3>
                                <p className="text-slate-600">Jl. Pelabuhan Merak, Banten</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-4 text-center">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                                <AppLogoIcon width={60} height={60} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">IKKP Merak</h3>
                                <p className="text-sm text-slate-400">Port Management System</p>
                            </div>
                        </div>
                        <p className="text-slate-400">© 2024 IKKP Merak. Semua hak cipta dilindungi undang-undang.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}
