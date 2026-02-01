import { Phone, MapPin, ArrowRight } from 'lucide-react';

export default function Preview({
    searchParams,
}: {
    searchParams: { [key: string]: string | undefined };
}) {
    const {
        name = 'My Website',
        slogan = 'Welcome to my website',
        description = 'No description provided.',
        phone = '000-0000-0000',
        address = 'Somewhere on Earth',
        color = '#000000',
    } = searchParams;

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-gray-200">
            {/* Header */}
            <header className="fixed w-full top-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">{name}</h1>
                    <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
                        <a href="#" className="hover:text-black transition">About</a>
                        <a href="#" className="hover:text-black transition">Services</a>
                        <a href="#" className="hover:text-black transition">Contact</a>
                    </nav>
                </div>
            </header>

            <main className="pt-16">
                {/* Hero Section */}
                <section
                    className="relative h-[80vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden"
                    style={{ backgroundColor: color }}
                >
                    <div className="absolute inset-0 bg-black/20" /> {/* Dim overlay for contrast */}
                    <div className="relative z-10 max-w-4xl mx-auto text-white">
                        <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
                            {slogan}
                        </h2>
                        <p className="text-xl md:text-2xl opacity-90 font-light max-w-2xl mx-auto mb-10">
                            {description.slice(0, 50)}...
                        </p>
                        <button className="bg-white text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transform transition hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-2 mx-auto">
                            더 알아보기 <ArrowRight size={20} />
                        </button>
                    </div>
                </section>

                {/* About Section */}
                <section className="py-24 px-6">
                    <div className="max-w-3xl mx-auto">
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 block">About Us</span>
                        <h3 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">
                            우리가 하는 일에 대해 <br />
                            더 자세히 알아보세요.
                        </h3>
                        <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {description}
                        </p>
                    </div>
                </section>

                {/* Contact / CTA Section */}
                <section className="py-24 px-6 bg-gray-50">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-3xl font-bold mb-12">함께 시작해볼까요?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left max-w-2xl mx-auto">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <Phone className="mb-4 text-gray-400" size={32} />
                                <h4 className="font-bold text-lg mb-2">전화 문의</h4>
                                <p className="text-gray-600 mb-4">언제든 편하게 연락주세요.</p>
                                <p className="text-xl font-semibold">{phone}</p>
                            </div>
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                                <MapPin className="mb-4 text-gray-400" size={32} />
                                <h4 className="font-bold text-lg mb-2">방문 안내</h4>
                                <p className="text-gray-600 mb-4">직접 만나서 이야기해요.</p>
                                <p className="text-lg font-medium break-keep">{address}</p>
                            </div>
                        </div>

                        <button className="mt-16 bg-black text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-gray-800 transition shadow-xl">
                            지금 상담하기
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-gray-200">
                <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>© 2024 {name}. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-black">Terms</a>
                        <a href="#" className="hover:text-black">Privacy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
